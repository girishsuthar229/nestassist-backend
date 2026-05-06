import { PaymentStatus, BookingStatus } from "@/enums/transaction.enum";
import logger from "@/utils/logger";
import {
  logPaymentFailed,
  logPaymentSuccess,
  logPaymentRefunded,
  logPaymentRefundFailed,
} from "./logger/payment.logger";
import { buildMetadata } from "./stripeWebhook.service";
import { RazorpayPaymentEntity } from "@/dtos/serviceBoookingCheckout.dto";
import Razorpay from "razorpay";
import sequelize from "../configs/db";
import { CurrencySymbol } from "@/enums/log.enum";
import * as RazorpayWebhookRepository from "../repositories/razorpayWebhook.repository";
import { sendBookingConfirmationEmail } from "@/utils/mail.util";
import dotenv from "dotenv";
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_SECRET_KEY || "",
});

/**
 * @name handleRazorpayEvent
 * @description
 * Main handler for Razorpay webhook events. Routes events to specific handlers based on event type.
 * Handles payment success, failure and order expiration events to update booking and payment records accordingly.
 * @access Private
 */
export const handleRazorpayEvent = async (payload: {
  event: string;
  payload: {
    order: { entity: { id: string } };
    payment: {
      entity: {
        id: string;
        order_id: string;
      };
    };
  };
}) => {
  const event = payload.event;
  const data = payload.payload;

  logger.info(`Razorpay Webhook Event: ${event}`);

  try {
    switch (event) {
      case "payment.captured":
      case "order.paid": {
        const orderId = data.order
          ? data.order.entity.id
          : data.payment.entity.order_id;
        return handleOrderPaid(orderId, data.payment.entity);
      }

      case "payment.failed":
        return handlePaymentFailed(data.payment.entity);

      case "order.notification.expired":
      case "order.expired":
        return handleOrderExpired(data.order.entity);

      default:
        logger.debug("Unhandled Razorpay event", { event });
    }
  } catch (err) {
    logger.error("Razorpay webhook error", { error: err });
    throw err;
  }
};

/**
 * @name handleOrderPaid
 * @description
 * Handles successful payment events. Updates payment and booking records to PAID and CONFIRMED respectively.
 * Also checks if the booking was expired before payment completion and initiates refund if necessary.
 * Loads service and user context for logging purposes. Logs payment success or refund events accordingly.
 * @access Private
 */
const handleOrderPaid = async (
  orderId: string,
  paymentEntity: { id: string }
) => {
  const payment = await RazorpayWebhookRepository.findPaymentByOrderId(orderId);

  if (!payment) {
    logger.error(`Payment not found for Razorpay Order ID: ${orderId}`);
    return;
  }

  if (payment.paymentStatus === PaymentStatus.PAID) return;

  const booking = await RazorpayWebhookRepository.findBookingByPaymentId(
    payment.id
  );

  if (!booking) {
    logger.error(`Booking not found for Payment ID: ${payment.id}`);
    return;
  }

  const isExpired =
    booking.expiresAt && booking.expiresAt.getTime() < Date.now();

  const loadContext = async () => {
    return await RazorpayWebhookRepository.getServiceAndUserContext(
      payment.serviceId,
      payment.userId
    );
  };

  if (isExpired) {
    try {
      // Initiate refund for expired booking
      await razorpay.payments.refund(paymentEntity.id, {
        notes: {
          bookingId: booking.id.toString(),
          paymentId: payment.id.toString(),
          reason: "Booking expired before payment completed",
        },
      });

      await RazorpayWebhookRepository.updatePaymentAndBookingWithTransaction(
        payment,
        booking,
        {
          paymentStatus: PaymentStatus.REFUNDED,
          bookingStatus: BookingStatus.CANCELLED,
          paymentIntentId: paymentEntity.id,
          paidAt: new Date(),
        },
        {
          status: BookingStatus.CANCELLED,
          cancellationReason: "Booking expired before payment completed",
        }
      );

      const { service, user } = await loadContext();
      await logPaymentRefunded({
        bookingId: booking.id,
        metadata: buildMetadata(payment, booking, service?.name || ""),
        message: `Payment of ${
          payment.currency.toUpperCase() === "USD"
            ? CurrencySymbol.USD
            : CurrencySymbol.INR
        }${payment.totalAmount} was refunded to ${
          user?.email || "user"
        } for booking of "${
          service?.name || ""
        }" expired before payment completed via Razorpay`,
      });

      return;
    } catch (refundError) {
      const { service } = await loadContext();
      await logPaymentRefundFailed({
        bookingId: booking.id,
        message: `Payment refund failed for expired booking of "${
          service?.name || ""
        }" via Razorpay`,
        metadata: buildMetadata(payment, booking, service?.name || ""),
      });
      throw refundError;
    }
  }

  // Normal success flow
  await RazorpayWebhookRepository.updatePaymentAndBookingWithTransaction(
    payment,
    booking,
    {
      paymentStatus: PaymentStatus.PAID,
      bookingStatus: BookingStatus.CONFIRMED,
      paymentIntentId: paymentEntity.id,
      paidAt: new Date(),
    },
    { status: BookingStatus.CONFIRMED }
  );

  const { service, user } = await loadContext();

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
      amountStr
    ).catch((err) => {
      logger.error(`Failed to send booking confirmation email: ${err.message}`);
    });
  }

  await logPaymentSuccess({
    bookingId: booking.id,
    metadata: buildMetadata(payment, booking, service?.name || ""),
    message: `Payment of ${
      payment.currency.toUpperCase() === "USD"
        ? CurrencySymbol.USD
        : CurrencySymbol.INR
    }${payment.totalAmount} was successful${
      service?.name ? ` for booking "${service.name}"` : ""
    }${user?.email ? ` by ${user.email}` : ""} via Razorpay`,
  });
};

/**
 * @name markPaymentAsFailed
 * @description
 * Utility function to mark a payment as failed and cancel the associated booking if applicable.
 * Updates payment status to FAILED and booking status to CANCELLED with appropriate cancellation reason.
 * Loads service context for logging purposes. Logs payment failure event with metadata for debugging and analytics.
 * @access Private
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
  const payment = await RazorpayWebhookRepository.findPaymentById(paymentId);
  if (!payment) {
    logger.error("Payment not found", { paymentId });
    return;
  }

  if (payment.paymentStatus === PaymentStatus.FAILED) return;

  const service = await RazorpayWebhookRepository.findServiceById(
    payment.serviceId
  );

  await sequelize.transaction(async (transaction) => {
    await payment.update(
      {
        paymentStatus: PaymentStatus.FAILED,
        bookingStatus: BookingStatus.CANCELLED,
      },
      { transaction }
    );

    if (!bookingId) return;

    const booking = await RazorpayWebhookRepository.findBookingById(bookingId);
    if (!booking) return;

    await booking.update(
      {
        status: BookingStatus.CANCELLED,
        cancellationReason:
          cancellationReason || "Cancelled from payment gateway",
      },
      { transaction }
    );

    await logPaymentFailed({
      bookingId: booking.id,
      metadata: buildMetadata(payment, booking, service?.name || ""),
      message: `Payment failed${
        service?.name ? ` for booking '${service.name}'` : ""
      } due to ${cancellationReason || "unknown"} via Razorpay`,
    });
  });
};

/**
 * @name handlePaymentFailed
 * @description
 * Handles payment failure events from Razorpay. Finds the associated payment and booking records and marks the payment as failed.
 * Extracts error description from Razorpay event to use as cancellation reason. Logs a warning if payment record is not found for the given order ID.
 * @access Private
 */
const handlePaymentFailed = async (
  paymentEntity: RazorpayPaymentEntity
): Promise<void> => {
  const { order_id: orderId, error_description } = paymentEntity;

  const payment = await RazorpayWebhookRepository.findPaymentByOrderId(orderId);

  if (!payment) {
    logger.warn(`Payment not found for Order: ${orderId}`);
    return;
  }

  const booking = await RazorpayWebhookRepository.findBookingByPaymentId(
    payment.id
  );

  return markPaymentAsFailed({
    paymentId: payment.id,
    bookingId: booking?.id,
    cancellationReason: error_description || "Payment failed",
  });
};

/**
 * @name handleOrderExpired
 * @description
 * Handles order expiration events from Razorpay. Finds the associated payment and booking records and marks the payment as failed with a specific cancellation reason indicating user did not complete payment within time limit.
 * Logs a warning if payment record is not found for the given order ID. This ensures that bookings are not left in limbo if the user fails to complete payment in time.
 * @access Private
 */
const handleOrderExpired = async (orderEntity: { id: string }) => {
  const payment = await RazorpayWebhookRepository.findPaymentByOrderId(
    orderEntity.id
  );

  if (!payment) return;

  const booking = await RazorpayWebhookRepository.findBookingByPaymentId(
    payment.id
  );

  return markPaymentAsFailed({
    paymentId: payment.id,
    bookingId: booking?.id,
    cancellationReason: "User did not complete payment within time limit",
  });
};
