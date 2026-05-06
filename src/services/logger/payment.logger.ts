import { logEvent } from "@/services/logger.service";
import { LogEventType, LogCategory, LogStatus } from "@/enums/log.enum";
import { UpdatedBookingPaymentInput } from "@/dtos/serviceBoookingCheckout.dto";

export const logPaymentInitiated = async ({
  metadata,
  message,
}: {
  metadata: UpdatedBookingPaymentInput;
  message?: string;
}) => {
  await logEvent({
    eventType: LogEventType.PAYMENT_INITIATED,
    category: LogCategory.PAYMENT,
    message: message || "Payment initiated",

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

export const logPaymentSuccess = async ({
  bookingId,
  message,
  metadata,
}: {
  bookingId: number;
  message?: string;
  metadata: UpdatedBookingPaymentInput;
}) => {
  await logEvent({
    eventType: LogEventType.PAYMENT_SUCCESS,
    category: LogCategory.PAYMENT,
    message: message || "Payment successful",
    serviceId: metadata.serviceId,
    userId: metadata.userId,
    bookingId: bookingId,
    status: LogStatus.SUCCESS,

    metadata: { ...metadata },
  });
};

export const logPaymentFailed = async ({
  bookingId,
  metadata,
  message,
}: {
  bookingId: number;
  metadata: { userId: number; serviceId: number };
  message?: string;
}) => {
  await logEvent({
    eventType: LogEventType.PAYMENT_FAILED,
    category: LogCategory.PAYMENT,
    message: message || "Payment failed",
    serviceId: metadata.serviceId,
    userId: metadata.userId,
    bookingId,
    status: LogStatus.FAILED,
    metadata: { ...metadata },
  });
};

export const logPaymentRefunded = async ({
  bookingId,
  message,
  metadata,
}: {
  bookingId: number;
  message?: string;
  metadata: UpdatedBookingPaymentInput;
}) => {
  await logEvent({
    eventType: LogEventType.PAYMENT_REFUNDED,
    category: LogCategory.PAYMENT,
    message: message || "Payment refunded",
    serviceId: metadata.serviceId,
    userId: metadata.userId,
    bookingId,
    status: LogStatus.SUCCESS,
    metadata: { ...metadata },
  });
};

export const logPaymentRefundFailed = async ({
  bookingId,
  message,
  metadata,
}: {
  bookingId: number;
  message?: string;
  metadata: UpdatedBookingPaymentInput;
}) => {
  await logEvent({
    eventType: LogEventType.PAYMENT_REFUNDED_FAILED,
    category: LogCategory.PAYMENT,
    message: message || "Payment refund failed",
    serviceId: metadata.serviceId,
    userId: metadata.userId,
    bookingId,
    status: LogStatus.FAILED,
    metadata: { ...metadata },
  });
};
