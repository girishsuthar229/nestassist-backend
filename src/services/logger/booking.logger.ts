import { UpdatedBookingPaymentInput } from "@/dtos/serviceBoookingCheckout.dto";
import { LogCategory, LogEventType, LogStatus } from "@/enums/log.enum";
import { logEvent } from "../logger.service";
import { BookingStatus } from "@/enums/transaction.enum";

export const logBookingInitiated = async ({
  metadata,
  message,
}: {
  metadata: UpdatedBookingPaymentInput;
  message?: string;
}) => {
  await logEvent({
    eventType: LogEventType.BOOK_SERVICE_CLICK,
    category: LogCategory.BOOKING,
    message: message || "Booking initiated",

    userId: metadata.userId,
    serviceId: metadata.serviceId,
    status: LogStatus.INITIATED,

    metadata: {
      amount: metadata.amount,
      paymentMethod: metadata.paymentMethod,
      paymentGateway: metadata.paymentGateway,
    },
  });
};

export const logBookingBlocked = async ({
  metadata,
  message,
}: {
  metadata: UpdatedBookingPaymentInput;
  message?: string;
}) => {
  await logEvent({
    eventType: LogEventType.BOOKING_SERVICE_BLOCK,
    category: LogCategory.BOOKING,
    message: message || "Booking blocked for few minutes",
    userId: metadata.userId,
    serviceId: metadata.serviceId,
    status: LogStatus.SUCCESS,

    metadata: {
      amount: metadata.amount,
      paymentMethod: metadata.paymentMethod,
      paymentGateway: metadata.paymentGateway,
    },
  });
};

export const logBookingStatusChanged = async ({
  bookingId,
  userId,
  serviceId,
  oldStatus,
  newStatus,
  message,
}: {
  bookingId: number;
  userId?: number;
  serviceId?: number;
  oldStatus?: BookingStatus | string;
  newStatus: BookingStatus | string;
  message?: string;
}) => {
  await logEvent({
    eventType: LogEventType.BOOKING_STATUS_CHANGED,
    category: LogCategory.BOOKING,
    bookingId: bookingId,
    message:
      message ||
      `Booking status changed from ${oldStatus || "UNKNOWN"} to ${newStatus}`,

    userId,
    serviceId,
    status: LogStatus.SUCCESS,

    metadata: {
      bookingId,
      oldStatus,
      newStatus,
    },
  });
};

