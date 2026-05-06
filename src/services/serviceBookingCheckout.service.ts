import { Category, ServiceType } from "@/models";
import { ApiError } from "../utils/apiError.util";
import logger from "../utils/logger";
import Stripe from "stripe";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import { parseBookingDate } from "@/utils/common.utils";
import {
  BookingStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
} from "@/enums/transaction.enum";
import { clearBookingManagementCache } from "@/utils/caching-utils/bookingManagementCache.util";
import { STATUS_CODE } from "@/enums";
import {
  BookingPaymentInput,
  BookingPaymentRecords,
  ComputedAmounts,
  PaymentResult,
  UpdatedBookingPaymentInput,
} from "@/dtos/serviceBoookingCheckout.dto";
import {
  logPaymentInitiated,
  logPaymentFailed,
} from "@/services/logger/payment.logger";
import {
  logBookingBlocked,
  logBookingInitiated,
} from "./logger/booking.logger";
import { logServiceProviderAssigned } from "./logger/serviceProvider.logger";
import { formatDateShort } from "@/utils/adminBookingManagement.util";
import { logEvent } from "./logger.service";
import { MESSAGES } from "@/constants/messages";
import { CurrencyValueSymbol, LogCategory, LogEventType, LogStatus } from "@/enums/log.enum";
import * as repository from "@/repositories/serviceBookingCheckout.repository";
import { MS_IN_MINUTE, MAX_BUFFER_MINUTES, RETRIED_BOOKING_STATUS, RETRIED_PAYMENT_STATUS, EXPIRED_MINUTES } from "@/constants";
import {  createCouponUsage } from "./couponUsage.service";
import { ServicePartnerWithUser } from "@/dtos/servicePartner.dto";
dotenv.config();

// Configuration and environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY || "";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";


// Initialize payment gateway clients
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
});

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET_KEY,
});

/**
 * Finds an available service partner for a specific category and time slot.
 */
export function getAvailablePartner(params: {
  subCategoryId: number;
  serviceId: number;
  bookingDate: Date;
  duration: number;
  assignOne: true;
}): Promise<ServicePartnerWithUser>;

export function getAvailablePartner(params: {
  subCategoryId: number;
  serviceId: number;
  bookingDate: Date;
  duration: number;
  assignOne?: false;
}): Promise<ServicePartnerWithUser[]>;

export async function getAvailablePartner({
  subCategoryId,
  serviceId,
  bookingDate,
  duration,
  assignOne = false,
}: {
  subCategoryId: number;
  serviceId: number;
  bookingDate: Date;
  duration: number;
  assignOne?: boolean;
}) {
  const SLOT_DURATION = Math.min(duration / 2, MAX_BUFFER_MINUTES) * MS_IN_MINUTE;

  const newStart = bookingDate.getTime();
  const newEnd = newStart + SLOT_DURATION;

  // 1. Fetch eligible partners
  const eligiblePartners = await repository.findEligiblePartners(subCategoryId, serviceId);

  if (assignOne) {
    if (!eligiblePartners.length) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        MESSAGES.SERVICE.NO_PARTNER_AVAILABLE,
      );
    }
  }
  
  const partnerIds = eligiblePartners.map((p) => p.id);

  // 2. Fetch all relevant bookings in ONE query
  const bookings = await repository.findRelevantBookings(partnerIds as number[]);

  // 3. Group bookings by partnerId to facilitate easier availability checks
  const bookingsMap = new Map<number, typeof bookings>();

  for (const booking of bookings) {
    const list = bookingsMap.get(booking.servicePartnerId as number) || [];
    list.push(booking);
    bookingsMap.set(booking.servicePartnerId as number, list);
  }

  // 4. Filter available partners by checking for overlapping booking slots
  const availablePartners = eligiblePartners.filter((partner) => {
    const partnerBookings = bookingsMap.get(Number(partner.id)) || [];

    return !partnerBookings.some((b) => {
      const bStart = new Date(b.bookingDate).getTime();
      // Calculate end time: duration is halved or capped at 60 mins (business rule)
      const bEnd =
        bStart + Math.min((b.serviceDuration || 0) / 2, MAX_BUFFER_MINUTES) * MS_IN_MINUTE;

      // Check for overlap between new booking and existing ones
      return newStart < bEnd && newEnd > bStart;
    });
  });


  // 5. Random selection
  if (assignOne) {
    if (!availablePartners.length) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        MESSAGES.SERVICE.NO_PARTNER_AVAILABLE_FOR_SLOT,
      );
    }
    return availablePartners[
      Math.floor(Math.random() * availablePartners.length)
    ];
  }

  return availablePartners;
};

/**
 * Orchestrates the entire booking payment process.
 * Validates input, checks for existing payments, finds a partner,
 * and delegates to specific payment handlers (Stripe, Razorpay, or Cash).
 */
export const processBookingPayment = async (
  input: BookingPaymentInput,
): Promise<PaymentResult> => {
  validateBookingInput(input);

  const alreadyPaid = await repository.findPaidPayment(
    input.userId,
    input.serviceId,
    input.slot,
  );

  if (alreadyPaid) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SERVICE.ALREADY_PAID);
  }

  const existingPayment = await repository.findPendingPayment(
    input.userId,
    input.serviceId,
    input.slot,
  );

  // Check if an active payment session already exists to avoid duplicate charges
  if (existingPayment) {
    const booking = await repository.findBookingByPaymentId(existingPayment.id);

    if (
      booking?.expiresAt &&
      booking.expiresAt.getTime() < new Date().getTime()
    ) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SERVICE.SLOT_EXPIRED);
    }

    if (existingPayment?.sessionId) {
      const session = await stripe.checkout.sessions.retrieve(
        existingPayment.sessionId,
      );

      // If already paid, return early with success message
      if (session.payment_status === "paid") {
        return {
          bookingId: booking?.id || 0,
          paymentMethod: PaymentMethod.CARD,
          paymentGateway: PaymentGateway.STRIPE,
          amount: Number(existingPayment.totalAmount),
          message: MESSAGES.PAYMENT.ALREADY_COMPLETED,
        };
      }

      // If session is still open, reuse the existing sessionId
      if (session.status === "open") {
        return {
          bookingId: booking?.id || 0,
          paymentMethod: PaymentMethod.CARD,
          amount: Number(existingPayment.totalAmount),
          message: MESSAGES.PAYMENT.REUSING_EXISTING_STRIPE_SESSION,
          paymentGateway: PaymentGateway.STRIPE,
          sessionId: existingPayment.sessionId,
        };
      }
    }

    if (existingPayment?.orderId) {
      return {
        bookingId: booking?.id || 0,
        paymentMethod: PaymentMethod.CARD,
        message: MESSAGES.PAYMENT.REUSING_EXISTING_RAZORPAY_SESSION,
        paymentGateway: PaymentGateway.RAZORPAY,
        sessionId: existingPayment.sessionId,
        orderId: existingPayment.orderId || "",
        amount: Number(existingPayment.totalAmount),
      };
    }
  }

  const [service, offer, address, user] = await Promise.all([
    repository.findServiceWithContext(input.serviceId),
    input.couponId ? repository.findOfferById(input.couponId) : null,
    repository.findAddressById(input.addressId),
    repository.findUserById(input.userId),
  ]);

  if (!service) throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SERVICE.NOT_FOUND);

  let serviceTypeId = (service as any)?.subCategory?.category?.serviceType?.id;
  if (!serviceTypeId && (service as any)?.categoryId) {
    const category = await Category.findByPk(
      Number((service as any).categoryId),
      {
        attributes: ["id"],
        include: [
          {
            model: ServiceType,
            as: "serviceType",
            attributes: ["id"],
            required: true,
          },
        ],
      },
    );
    serviceTypeId = (category as any)?.serviceType?.id;
  }

  const serviceAddress = [
    address?.houseFlatNumber,
    address?.landmark,
    address?.address,
  ]
    .filter(Boolean)
    .join(", ");

  const amounts = computeAmounts({
    amount: Number(service.price),
    tax: input.tax,
    offerDiscountPercentage: offer?.isActive
      ? Number(offer.discountPercentage || 0)
      : 0,
  });

  let payload: UpdatedBookingPaymentInput = {
    ...input,
    ...amounts,
    serviceName: service.name,
    serviceDuration: service.duration || 0,
    serviceAddress,
    serviceTypeId: serviceTypeId ? Number(serviceTypeId) : undefined,
    userEmail: user?.email,
  };

  const message = `Customer clicked on book service${
    service?.name ? ` for "${service.name}"` : ""
  }${
    input?.slot?.date
      ? ` scheduled on ${formatDateShort(new Date(input.slot.date))}`
      : ""
  }${input?.slot?.time ? ` at ${input.slot.time}` : ""}.`;

  logBookingInitiated({
    metadata: payload,
    message,
  });

  const partner = await getAvailablePartner({
    subCategoryId: service.subCategoryId,
    bookingDate: parseBookingDate(input.slot.date, input.slot.time),
    serviceId: input.serviceId,
    duration: service.duration || 0,
    assignOne: true,
  });

  if (!partner)
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SERVICE.NO_PARTNER_AVAILABLE_FOR_SLOT);

  payload.partnerId = partner.id;

  logPaymentInitiated({
    metadata: payload,
    message:
      `Payment initiated for service ${service.name} by ${user?.email} on ${formatDateShort(new Date(input.slot.date))} at ${input.slot.time}` ||
      "",
  });

  if (input.paymentMethod === PaymentMethod.CASH) {
    return handleCash(payload);
  }

  const { booking, payment } = await createRecords(payload);

  if (input.paymentGateway === PaymentGateway.STRIPE) {
    return stripeCheckout({
      bookingId: booking.id,
      userId: payload.userId,
      serviceId: payload.serviceId,
      paymentId: payment.id,
      userEmail: payload.userEmail || "",
      serviceName: payload.serviceName,
      slot: payload.slot,
      totalAmount: payload.totalAmount,
    });
  } else {
    return razorpayCheckout({
      bookingId: booking.id,
      serviceId: payload.serviceId,
      paymentId: payment.id,
      userId: payload.userId,
      totalAmount: payload.totalAmount,
    });
  }
};

/**
 * Finalizes a booking that uses Cash as the payment method.
 */
const handleCash = async (
  input: UpdatedBookingPaymentInput,
): Promise<PaymentResult> => {
  const { booking } = await createRecords(input);
  clearBookingManagementCache();
  await logEvent({
    eventType: LogEventType.BOOK_SERVICE_CONFIRM,
    category: LogCategory.BOOKING,
    userId: input.userId,
    serviceId: input.serviceId,
    status: LogStatus.SUCCESS,
    metadata: {
      amount: input.totalAmount,
      paymentMethod: input.paymentMethod,
      paymentGateway: input.paymentGateway,
    },
    message: MESSAGES.BOOKING.CONFIRMED_WITH_CASH_PAYMENT,
  });
  return {
    bookingId: booking.id,
    paymentMethod: PaymentMethod.CASH,
    paymentGateway: input.paymentGateway,
    amount: Number(input.totalAmount),
    message: MESSAGES.BOOKING.CONFIRMED_WITH_CASH_PAYMENT,
  };
};

/**
 * Initiates a Stripe Checkout session for card payments.
 */
const stripeCheckout = async ({
  bookingId,
  userId,
  serviceId,
  paymentId,
  userEmail,
  serviceName,
  slot,
  totalAmount,
}: {
  bookingId: number;
  userId: number;
  serviceId: number;
  paymentId: number;
  userEmail: string;
  serviceName: string;
  slot: { date: string; time: string };
  totalAmount: number;
}) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: CurrencyValueSymbol.USD,
            product_data: {
              name: serviceName,
              description: `Service scheduled on ${slot.date} at ${slot.time}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          bookingId: bookingId.toString(),
          paymentId: paymentId.toString(),
        },
      },

      success_url: `${FRONTEND_URL}/checkout/success/${bookingId}`,
      cancel_url: `${FRONTEND_URL}/checkout/${serviceId}?bookingId=${bookingId}`,
      metadata: {
        bookingId: bookingId.toString(),
        paymentId: paymentId.toString(),
      },
    });

    await repository.updatePayment(paymentId, {
      orderId: "",
      sessionId: session.id,
    });

    return {
      bookingId,
      paymentMethod: PaymentMethod.CARD,
      paymentGateway: PaymentGateway.STRIPE,
      amount: totalAmount,
      message: MESSAGES.PAYMENT.REDIRECTING_TO_STRIPE_CHECKOUT,
      sessionId: session.id,
    };
  } catch (err) {
    if (bookingId) {
      await logPaymentFailed({
        bookingId,
        metadata: { userId, serviceId },
        message: MESSAGES.PAYMENT.STRIPE_ERROR,
      });
    }
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.PAYMENT.STRIPE_ERROR);
  }
};

/**
 * Creates a Razorpay order for card payments.
 */
const razorpayCheckout = async ({
  bookingId,
  serviceId,
  paymentId,
  userId,
  totalAmount,
}: {
  bookingId: number;
  serviceId: number;
  paymentId: number;
  userId: number;
  totalAmount: number;
}) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: CurrencyValueSymbol.USD,
      receipt: `receipt_${bookingId}`,
    });

    await repository.updatePayment(paymentId, {
      orderId: order.id,
      sessionId: "",
    });

    return {
      bookingId,
      paymentMethod: PaymentMethod.CARD,
      paymentGateway: PaymentGateway.RAZORPAY,
      amount: totalAmount,
      message: MESSAGES.BOOKING.RAZORPAY_ORDER_CREATED,
      orderId: order.id,
    };
  } catch (err: any) {
    if (bookingId) {
      await logPaymentFailed({
        bookingId,
        metadata: { userId, serviceId },
        message: err?.message || MESSAGES.PAYMENT.RAZORPAY_ERROR,
      });
    }
    logger.error(`Razorpay error: ${err?.message}`);
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      err?.message || MESSAGES.PAYMENT.RAZORPAY_ERROR,
    );
  }
};

/**
 * Atomically creates Booking and Payment records in the database.
 * Also logs the assignment of the service provider and blocks the slot.
 */
const createRecords = async (
  input: UpdatedBookingPaymentInput,
): Promise<BookingPaymentRecords> => {
  const bookingDate = parseBookingDate(input.slot.date, input.slot.time);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + EXPIRED_MINUTES);

  if (input.couponId) {
    await createCouponUsage(String(input.couponId), String(input.userId));
  }

  const { booking, payment } =
    await repository.createBookingAndPaymentWithTransaction(
      {
        userId: input.userId,
        serviceId: input.serviceId,
        addressId: input.addressId,
        serviceTypeId: input.serviceTypeId,
        status: BookingStatus.PENDING,
        bookingDate,
        amount: input.totalAmount,
        serviceAddress: input.serviceAddress,
        serviceDuration: input.serviceDuration,
        servicePartnerId: input.partnerId,
        expiresAt,
      },
      {
        userId: input.userId,
        serviceId: input.serviceId,
        addressId: input.addressId,
        slot: input.slot,
        amount: toFixed(input.amount),
        tax: toFixed(input.taxPercentage),
        discount: toFixed(input.discount),
        totalAmount: toFixed(input.totalAmount),
        currency: CurrencyValueSymbol.USD,
        paymentMethod: input.paymentMethod,
        paymentGateway: input.paymentGateway,
        paymentStatus: PaymentStatus.PENDING,
        bookingStatus: BookingStatus.PENDING,
        couponId: input.couponId,
        servicePartnerId: input.partnerId,
      },
    );

  const partner = await repository.findPartnerById(input.partnerId as number);
  if (!partner)
    throw new ApiError(STATUS_CODE.BAD_REQUEST, "Partner not found");
  const partnerUser = await repository.findUserById(partner.userId);

  if (!partnerUser)
    throw new ApiError(STATUS_CODE.BAD_REQUEST, "Partner user not found");

  await logServiceProviderAssigned({
    metadata: input,
    message: `Service Provider ${partnerUser?.name ? `'${partnerUser.name}'` : ""} has been assigned to service '${input.serviceName}' on ${formatDateShort(new Date(input.slot.date))} at ${input.slot.time}`,
  });

  const blockedMessage = `Blocked service for ${EXPIRED_MINUTES} minutes${
    input?.serviceName ? `: '${input.serviceName}'` : ""
  }${
    partnerUser?.name ? ` with partner '${partnerUser.name}'` : ""
  } has been placed after successful payment and is currently under hold${
    input?.slot?.date
      ? ` on slot of ${formatDateShort(new Date(input.slot.date))}`
      : ""
  }${input?.slot?.time ? ` at ${input.slot.time}` : ""}`;

  await logBookingBlocked({
    metadata: input,
    message: blockedMessage,
  });
  clearBookingManagementCache();
  return { booking, payment };
};

/**
 * Calculates the financial breakdown of a booking including discounts and taxes.
 */
const computeAmounts = ({
  amount,
  tax = 0,
  offerDiscountPercentage = 0,
}: {
  amount: number;
  tax?: number;
  offerDiscountPercentage?: number;
}): ComputedAmounts => {
  // cap discount to amount
  const discount = Number(
    Math.min((amount * offerDiscountPercentage) / 100, amount),
  );

  const amountWithCoupon = Number(Math.max(0, amount - discount));

  // tax only on taxable value
  const taxAmount = Number((amount * tax) / 100);

  const totalAmount = Number(amountWithCoupon + taxAmount);

  return { amount, tax: taxAmount, taxPercentage: tax, discount, totalAmount };
};

/**
 * Helper to format numbers to a two-decimal place string.
 */
const toFixed = (v: number) => v.toFixed(2);

/**
 * Validates the structure and content of the booking payment request.
 */
const validateBookingInput = (input: BookingPaymentInput): void => {
  if (!input?.userId || !input?.serviceId || !input?.addressId) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.COMMON.INVALID_IDENTIFIERS);
  }

  if (!input.slot?.date || !input.slot?.time) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.COMMON.INVALID_SLOT);
  }

  if (Number.isNaN(new Date(input.slot.date).getTime())) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.COMMON.INVALID_DATE);
  }

  if (![PaymentMethod.CASH, PaymentMethod.CARD].includes(input.paymentMethod)) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.COMMON.INVALID_PAYMENT_METHOD);
  }

  if (
    input.paymentGateway &&
    ![PaymentGateway.STRIPE, PaymentGateway.RAZORPAY].includes(
      input.paymentGateway,
    )
  ) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.COMMON.INVALID_PAYMENT_GATEWAY);
  }

  if (input.tax && typeof input.tax !== "number") {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.COMMON.INVALID_TAX);
  }
};

/**
 * Retrieves a booking record along with its associated payment details.
 */
export const getBookingWithPaymentService = async (bookingId: number) => {
  const booking = await repository.findBookingWithPayment(bookingId);
  if (!booking)
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.BOOKING.NOT_FOUND);
  return booking;
};

/**
 * Allows a user to retry the payment for an existing booking that is pending or failed.
 * Currently supports finalization for cash payments.
 */
export const retryBookingPaymentService = async ({
  bookingId,
  paymentMethod,
  paymentGateway,
}: {
  bookingId: number;
  paymentMethod: PaymentMethod;
  paymentGateway: PaymentGateway;
}): Promise<PaymentResult> => {
  const booking = await repository.findBookingById(bookingId);

  if (!booking || !booking.paymentId) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.BOOKING.NOT_FOUND_OR_PAYMENT_NOT_LINKED);
  }

  const payment = await repository.findPaymentById(booking.paymentId);

  if (!payment) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.PAYMENT.NOT_FOUND);
  }

  const [service, user] = await Promise.all([
    repository.findServiceWithContext(booking.serviceId),
    repository.findUserById(booking.userId),
  ]);

  const isBookingValid = RETRIED_BOOKING_STATUS.includes(booking.status);
  const isPaymentValid = RETRIED_PAYMENT_STATUS.includes(payment.paymentStatus);
  const isNotExpired =
    booking.expiresAt && Date.now() < booking.expiresAt.getTime();

  const isEligibleForRetry = isBookingValid && isPaymentValid && isNotExpired;

  if (!isNotExpired) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      `Booking for ${service?.name || ""} with slot ${formatDateShort(new Date(payment.slot.date))}, ${payment.slot.time} is already expired so it's not eligible for retry`,
    );
  }

  if (!isEligibleForRetry) {
    throw new ApiError(
      4,
      `Booking for ${service?.name || ""} was already ${booking.status.toLowerCase()} and expired so it's not eligible for retry`,
    );
  }

  if (payment.paymentMethod === PaymentMethod.CASH) {
    await repository.updateBookingAndPaymentWithTransaction(
      booking,
      payment,
      { status: BookingStatus.PENDING },
      {
        paymentStatus: PaymentStatus.PENDING,
        bookingStatus: BookingStatus.PENDING,
        paymentMethod: PaymentMethod.CASH,
      },
    );

    return {
      bookingId: booking.id,
      paymentMethod: PaymentMethod.CASH,
      message: MESSAGES.BOOKING.CONFIRMED_WITH_CASH_PAYMENT,
      amount: Number(payment.totalAmount),
    };
  }

  if (paymentMethod === PaymentMethod.CARD) {
    const cardPayload = {
      bookingId,
      userId: booking.userId,
      serviceId: booking.serviceId,
      paymentId: booking.paymentId,
      userEmail: user?.email || "",
      serviceName: service?.name || "",
      slot: payment.slot || 0,
      totalAmount: Number(payment.totalAmount),
    };
    if (paymentGateway === PaymentGateway.STRIPE) {
      return stripeCheckout(cardPayload);
    }
    if (paymentGateway === PaymentGateway.RAZORPAY) {
      return razorpayCheckout(cardPayload);
    }

    return {
      bookingId: booking.id,
      paymentMethod: PaymentMethod.CARD,
      message: MESSAGES.BOOKING.CONFIRMED_WITH_CARD_PAYMENT,
      amount: Number(payment.totalAmount),
      paymentGateway,
    };
  }

  return {
    bookingId: booking.id,
    paymentMethod: paymentMethod,
    message: MESSAGES.PAYMENT.PAYMENT_METHOD_NOT_SUPPORTED,
    amount: Number(payment.totalAmount),
    paymentGateway,
  };
};
