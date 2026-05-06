/**
 * Stripe Webhook Service
 * Handles asynchronous notifications from Stripe regarding payment and checkout session events.
 */
import Stripe from "stripe";
import {
  BookingStatus,
  PaymentGateway,
  PaymentStatus,
} from "@/enums/transaction.enum";
import logger from "@/utils/logger";
import {
  logPaymentSuccess,
  logPaymentFailed,
  logPaymentRefunded,
  logPaymentRefundFailed,
} from "@/services/logger/payment.logger";
import { UpdatedBookingPaymentInput } from "@/dtos/serviceBoookingCheckout.dto";
import { Booking, Payment, Service, User } from "@/models";
import {
  findPaymentById,
  findBookingById,
  findServiceById,
  findUserById,
  updatePayment,
  updateBookingAndPaymentWithTransaction,
} from "@/repositories/stripeWebhook.repository";
import dotenv from "dotenv";
import { CurrencySymbol } from "@/enums/log.enum";
import { clearBookingManagementCache } from "@/utils/caching-utils/bookingManagementCache.util";
import { MESSAGES } from "@/constants/messages";
import { sendBookingConfirmationEmail } from "@/utils/mail.util";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * Main entry point for Stripe webhook events.
 * Routes events to specific handlers based on the event type.
 */
export const handleStripeEvent = async (event: Stripe.Event) => {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        return handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );

      case "payment_intent.payment_failed":
        return handlePaymentFailed(event.data.object as Stripe.PaymentIntent);

      case "checkout.session.expired":
        return handleSessionExpired(
          event.data.object as Stripe.Checkout.Session,
        );

      default:
        logger.debug("Unhandled Stripe event", { type: event.type });
    }
  } catch (err) {
    logger.error("Stripe webhook error", { error: err });
    throw err;
  }
};

/**
 * Prepares a structured object for booking and payment updates based on existing records.
 */
export const buildMetadata = (
  payment: Payment,
  booking: Booking,
  serviceName: string,
): UpdatedBookingPaymentInput => ({
  userId: payment.userId,
  serviceId: payment.serviceId,
  addressId: payment.addressId,
  slot: payment.slot,
  paymentMethod: payment.paymentMethod,
  paymentGateway: payment.paymentGateway || PaymentGateway.STRIPE,
  amount: Number(payment.amount),
  tax: Number((Number(payment.totalAmount) - (Number(payment.amount) - Number(payment.discount))).toFixed(2)),
  taxPercentage: Number(payment.tax),
  discount: Number(payment.discount),
  totalAmount: Number(payment.totalAmount),
  serviceName,
  serviceDuration: booking?.serviceDuration || 0,
  serviceAddress: booking?.serviceAddress || "",
  partnerId: payment.servicePartnerId || 0,
});

/**
 * Generates a human-readable success message for logging.
 */
const buildSuccessMessage = (payment: Payment, service: Service, user?: User) =>
  `Payment of ${payment.currency.toUpperCase() === "USD" ? "$" : ""}${payment.totalAmount} was successful${
    service?.name ? ` for booking "${service.name}"` : ""
  }${user?.email ? ` by ${user.email}` : ""} via Stripe`;

/**
 * Handles 'checkout.session.completed' event.
 * Updates payment and booking statuses to 'PAID' and 'PENDING' respectively.
 */
const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const paymentId = Number(session.metadata?.paymentId);
  const bookingId = Number(session.metadata?.bookingId);

  if (!paymentId || !bookingId) {
    logger.error(MESSAGES.BOOKING.MISSING_PAYMENT_ID_OR_BOOKING_ID, {
      paymentId,
      bookingId,
    });
    return;
  }

  // 1. Fetch core records in parallel using repository for better performance
  const [payment, booking] = await Promise.all([
    findPaymentById(paymentId),
    findBookingById(bookingId),
  ]);

  // 2. Early exit if records are missing or if it's a duplicate webhook (Idempotency)
  if (!payment || !booking) {
    logger.error(MESSAGES.BOOKING.PAYMENT_OR_BOOKING_NOT_FOUND, {
      paymentId,
      bookingId,
    });
    return;
  }

  const isExpired =
    booking.expiresAt && booking.expiresAt.getTime() < Date.now();

  // Lazy-load Service and User records only when needed for logging
  const loadContext = async () => {
    const [service, user] = await Promise.all([
      findServiceById(payment.serviceId),
      findUserById(payment.userId),
    ]);
    return { service, user };
  };

  if (isExpired) {
    try {
      await stripe.refunds.create({
        payment_intent: session.payment_intent as string,
        reason: "requested_by_customer",
        metadata: {
          bookingId: booking.id.toString(),
          paymentId: payment.id.toString(),
          reason: MESSAGES.BOOKING.BOOKING_EXPIRED_BEFORE_PAYMENT_COMPLETED,
        },
      });

      await updateBookingAndPaymentWithTransaction(
        booking,
        payment,
        {
          status: BookingStatus.CANCELLED,
          cancellationReason: "Booking expired before payment completed",
        },
        {
          paymentStatus: PaymentStatus.REFUNDED,
          bookingStatus: BookingStatus.CANCELLED,
          paymentIntentId: session.payment_intent as string,
          clientSecret: session.client_secret as string,
        },
      );

      const { service, user } = await loadContext();
      await logPaymentRefunded({
        bookingId: booking.id,
        metadata: buildMetadata(payment, booking, service?.name || ""),
        message: `Payment of ${payment.currency.toUpperCase() === "USD" ? CurrencySymbol.USD : CurrencySymbol.INR}${payment.totalAmount} was refunded to ${user?.email || "user"} for booking of "${service?.name || ""}" expired before payment completed with Stripe`,
      });
      clearBookingManagementCache();
      return;
    } catch (refundError) {
      const { service } = await loadContext();
      await logPaymentRefundFailed({
        bookingId: booking.id,
        message: `Payment refund failed for expired booking of "${service?.name || ""}" with Stripe`,
        metadata: buildMetadata(payment, booking, service?.name || ""),
      });
      throw refundError;
    }
  }

  if (payment.paymentStatus === PaymentStatus.PAID) {
    logger.warn("Duplicate webhook ignored", { paymentId });
    return;
  }

  await Payment.update(
    {
      paymentStatus: PaymentStatus.PAID,
      bookingStatus: BookingStatus.PENDING,
      paymentIntentId: session.payment_intent as string,
      clientSecret: session.client_secret as string,
      paidAt: new Date(),
    },
    {
      where: {
        id: payment.id,
        paymentStatus: PaymentStatus.PENDING,
      },
    },
  );

  // 3. Normal update logic (Success branch)
  await updateBookingAndPaymentWithTransaction(
    booking,
    payment,
    { status: BookingStatus.PENDING },
    {
      paymentStatus: PaymentStatus.PAID,
      bookingStatus: BookingStatus.PENDING,
      paymentIntentId: session.payment_intent as string,
      clientSecret: session.client_secret as string,
      paidAt: new Date(),
    },
  );

  // Lazy-load context for success logging
  const { service, user } = await loadContext();
  clearBookingManagementCache();

  // Send booking confirmation email to customer
  if (user?.email) {
    const amountStr = `${
      payment.currency.toUpperCase() === "USD"
        ? CurrencySymbol.USD
        : CurrencySymbol.INR
    }${payment.totalAmount}`;

    sendBookingConfirmationEmail(
      user.email,
      user.name,
      booking.id,
      service?.name || "Service",
      booking.bookingDate.toLocaleString(),
      amountStr,
    ).catch((err: unknown) => {
      logger.error(
        `Failed to queue booking confirmation email: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  await logPaymentSuccess({
    bookingId: booking.id,
    metadata: buildMetadata(payment, booking, service?.name || ""),
    message: buildSuccessMessage(payment, service!, user || undefined),
  });
};

/**
 * Common logic to mark a payment as failed and cancel the associated booking.
 */
export const markPaymentAsFailed = async ({
  paymentId,
  bookingId,
  cancellationReason,
}: {
  paymentId: number;
  bookingId?: number;
  cancellationReason?: string;
}) => {
  const payment = await findPaymentById(paymentId);
  if (!payment) {
    logger.error(MESSAGES.PAYMENT.NOT_FOUND, { paymentId });
    return;
  }

  // Idempotency guard: If already failed, skip
  if (payment.paymentStatus === PaymentStatus.FAILED) return;

  const service = await findServiceById(payment.serviceId);

  await updatePayment(payment, {
    paymentStatus: PaymentStatus.FAILED,
    bookingStatus: BookingStatus.CANCELLED,
  });
  if (!bookingId) {
    return;
  }

  const booking = await findBookingById(bookingId);
  if (!booking) return;

  await updateBookingAndPaymentWithTransaction(
    booking,
    payment,
    {
      status: BookingStatus.CANCELLED,
      cancellationReason:
        cancellationReason || "Cancelled from payment gateway",
    },
    {
      paymentStatus: PaymentStatus.FAILED,
      bookingStatus: BookingStatus.CANCELLED,
    },
  );

  clearBookingManagementCache();

  // Log the failure for audit trails
  await logPaymentFailed({
    bookingId: booking.id,
    metadata: buildMetadata(payment, booking, service?.name || ""),
    message: `Payment failed${
      service?.name ? ` for booking '${service.name}'` : ""
    } due to ${cancellationReason || "unknown"} with Stripe`,
  });
};

/**
 * Handles 'payment_intent.payment_failed' event.
 */
const handlePaymentFailed = async (intent: Stripe.PaymentIntent) => {
  const paymentId = Number(intent.metadata?.paymentId);
  const bookingId = intent.metadata?.bookingId;

  if (!paymentId) return;

  const failureReason =
    intent.last_payment_error?.message ||
    intent.last_payment_error?.decline_code ||
    intent.last_payment_error?.code ||
    MESSAGES.PAYMENT.PAYMENT_FAILED;

  return markPaymentAsFailed({
    paymentId,
    bookingId: bookingId ? Number(bookingId) : undefined,
    cancellationReason: failureReason,
  });
};

/**
 * Handles 'checkout.session.expired' event.
 * Occurs when a user starts checkout but doesn't complete it within the Stripe timeout.
 */
const handleSessionExpired = async (session: Stripe.Checkout.Session) => {
  const paymentId = Number(session.metadata?.paymentId);
  const bookingId = session.metadata?.bookingId;

  if (!paymentId) return;

  return markPaymentAsFailed({
    paymentId,
    bookingId: bookingId ? Number(bookingId) : undefined,
    cancellationReason:
      MESSAGES.BOOKING.USER_DID_NOT_COMPLETE_PAYMENT_WITHIN_TIME_LIMIT,
  });
};
