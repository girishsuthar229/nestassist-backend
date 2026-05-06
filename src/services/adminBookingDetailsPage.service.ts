import { adminBookingManagementRepository } from "@/repositories/adminBookingManagement.repository";
import { getLogsService } from "@/services/logger.service";
import { ApiError } from "@/utils/apiError.util";
import { STATUS_CODE } from "@/enums";
import { MESSAGES } from "@/constants/messages";
import { formatDateTimeDetail } from "@/utils/adminBookingManagement.util";
import { PaymentStatus } from "@/enums/transaction.enum";
import {
  AdminBookingDetails,
  BookingDetailsWithRelations,
} from "@/interfaces/adminBookingDetails.interface";
import { Log } from "@/models";

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const getAdminBookingDetails = async (
  bookingId: number,
): Promise<AdminBookingDetails> => {
  if (!Number.isFinite(bookingId) || bookingId <= 0) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.BOOKING.INVALID_ID);
  }

  const booking: BookingDetailsWithRelations | null =
    await adminBookingManagementRepository.getAdminBookingDetailsById(
      bookingId,
    );

  if (!booking) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.BOOKING.NOT_FOUND);
  }

  const serviceCommissionPercent = toNumber(booking.service?.commission) ?? 0;
  const amount = toNumber(booking.payment?.amount ?? booking.amount) ?? 0;
  const currency = String(booking.payment?.currency ?? "").trim() || "INR";

  const commissionAmount = Number(
    ((amount * serviceCommissionPercent) / 100).toFixed(2),
  );
  const partnerPayout = Number((amount - commissionAmount).toFixed(2));

  const subtotal = toNumber(booking.payment?.amount) ?? amount;
  const tax = toNumber(booking.payment?.tax) ?? 0;
  const discount = toNumber(booking.payment?.discount) ?? 0;
  const total = toNumber(booking.payment?.totalAmount) ?? amount;

  const paymentStatus = booking.payment?.paymentStatus as
    | PaymentStatus
    | undefined;
  const paid = paymentStatus === PaymentStatus.PAID ? total : 0;
  
  const paymentTransactionId =
    booking.payment?.paymentIntentId ||
    booking.payment?.orderId ||
    booking.payment?.sessionId;

  const details: AdminBookingDetails = {
    bookingId: String(booking.id),
    status: String(booking.status ?? ""),
    serviceId: booking.serviceId ? String(booking.serviceId) : undefined,
    serviceName: booking.service?.name ?? undefined,
    serviceType: booking.serviceType?.name ?? undefined,
    scheduledAt: booking.bookingDate
      ? formatDateTimeDetail(new Date(booking.bookingDate), {
          includeYear: true,
        })
      : undefined,
    createdAt: booking.createdAt
      ? formatDateTimeDetail(new Date(booking.createdAt), {
          includeYear: true,
        })
      : undefined,
    cancellationReason: booking.cancellationReason ?? undefined,
    customer: booking.customer
      ? {
          id: booking.customer?.id,
          name: booking.customer?.name,
          email: booking.customer?.email,
          phone: booking.customer?.mobileNumber,
          avatar: booking.customer?.profileImage,
        }
      : undefined,
    servicePartner: booking.servicePartner?.user
      ? {
          id: booking.servicePartner?.id,
          name: booking.servicePartner?.user?.name || "Unknown",
          email: booking.servicePartner?.user?.email,
          phone: booking.servicePartner?.user?.mobileNumber,
          avatar: booking.servicePartner?.user?.profileImage,
        }
      : undefined,
    payment: booking.payment
      ? {
          paymentStatus:
            booking.payment?.paymentStatus || PaymentStatus.PENDING,
          paymentMethod: booking.payment?.paymentMethod,
          paymentGateway: booking.payment?.paymentGateway,
          transactionId: paymentTransactionId
            ? String(paymentTransactionId)
            : undefined,
          paidAt: booking.payment?.paidAt
            ? formatDateTimeDetail(new Date(booking.payment?.paidAt), {
                includeYear: true,
              })
            : undefined,
        }
      : undefined,
    charges: {
      servicePartnerCharges: amount,
      commissionAmount,
      commissionPercent: serviceCommissionPercent,
      partnerPayout,
      currency,
    },
    customerPayment: {
      subtotal,
      tax,
      discount,
      total,
      paid,
      currency,
    },
  };

  return details;
};

export const getAdminBookingDetailsPageData = async (params: {
  bookingId: number;
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}): Promise<{
  data: {
    logs: Log[];
    logsPagination: {
      totalItems: number;
      currentPage: number;
      totalPages: number;
      limit: number;
    };
  };
  errors: Partial<Record<"logs", string>>;
}> => {
  const errors: Partial<Record<"logs", string>> = {};

  //Normalize once
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const sortBy =
    typeof params.sortBy === "string" ? params.sortBy : "createdAt";
  const sortOrder =
    params.sortOrder === "ASC" || params.sortOrder === "DESC"
      ? params.sortOrder
      : "DESC";

  try {
    const logsRes = await getLogsService({
      page,
      limit,
      sortBy,
      sortOrder,
      bookingId: String(params.bookingId),
    });

    return {
      data: {
        logs: logsRes.data ?? [],
        logsPagination: logsRes.pagination ?? {
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
          limit,
        },
      },
      errors,
    };
  } catch (e: unknown) {
    return {
      data: {
        logs: [],
        logsPagination: {
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
          limit,
        },
      },
      errors: {
        logs: e instanceof Error ? e.message : "Failed to fetch logs",
      },
    };
  }
};
