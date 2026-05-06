import { logEvent } from "@/services/logger.service";
import { LogEventType, LogCategory, LogStatus } from "@/enums/log.enum";
import { UpdatedBookingPaymentInput } from "@/dtos/serviceBoookingCheckout.dto";

export const logServiceProviderAssigned = async ({
  metadata,
  message,
}: {
  metadata: UpdatedBookingPaymentInput;
  message?: string;
}) => {
  await logEvent({
    eventType: LogEventType.SERVICE_PROVIDER_ASSIGNED,
    category: LogCategory.SERVICE_PROVIDER,
    message: message || "ServiceProvider assigned a partner",

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

export const logServiceProviderChanged = async ({
  bookingId,
  serviceId,
  message,
  userId,
}: {
  bookingId: number;
  serviceId: number;
  message?: string;
  userId?: number;
}) => {
  await logEvent({
    eventType: LogEventType.SERVICE_PROVIDER_CHANGED,
    category: LogCategory.SERVICE_PROVIDER,
    message: message || "Service Provider changed",
    status: LogStatus.SUCCESS,
    bookingId,
    serviceId,
    userId,
  });
};
