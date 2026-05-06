import { col, fn, Op, OrderItem, where } from "sequelize";
import sequelize from "../configs/db";
import { ApiError } from "@/utils/apiError.util";
import { ServiceType } from "@/models";
import { VerificationStatus } from "@/enums/servicePartner.enum";
import { parseNumber } from "@/utils/common.utils";
import {
  formatDateTimeDetail,
  mapBookingStatusToEnum,
  mapPaymentMethodFromLabel,
} from "@/utils/adminBookingManagement.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import {
  AdminCustomerDetailFilterQuery,
  CustomerBookingServiceResponse,
  CustomerBookingServices,
} from "@/interfaces/adminCustomer.interface";
import * as AdminCustomerRepository from "../repositories/adminCustomer.repository";
import type { BookingWithRelations } from "@/repositories/adminCustomer.repository";
export type BookingOrder = OrderItem[];
export type BookingSortKey =
  | "bookingId"
  | "serviceName"
  | "serviceType"
  | "assignedExpert"
  | "dateTime"
  | "amount"
  | "paymentMethod"
  | "bookingStatus";

/**
 * @name getCustomerDetailById
 * @description Get Customer Details By ID.
 * @access Private
 */
export const getCustomerDetailById = async (id: number) => {
  const customer = await AdminCustomerRepository.findCustomerById(id);

  if (!customer) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.CUSTOMER.NOT_FOUND);
  }

  const result = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    mobileNumber: customer.mobileNumber,
    isActive: customer.isActive,
  };

  return result;
};

/**
 * @name getCustomerDetailById
 * @description List Custmore users with pagination, filtering and sorting.
 * @access Private
 */
export const getCustomerBookingServices = async (
  customerId: number,
  query: AdminCustomerDetailFilterQuery
): Promise<CustomerBookingServiceResponse> => {
  const customer = await AdminCustomerRepository.findCustomerById(customerId);

  if (!customer) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.CUSTOMER.NOT_FOUND);
  }

  const page = parseNumber(query.page) ?? 1;
  const limit = parseNumber(query.limit) ?? 10;
  const offset = (Number(page) - 1) * Number(limit);

  const serviceType = String(query.serviceType ?? "").trim();
  const date = String(query.date ?? "").trim();
  const time = String(query.time ?? "").trim();

  const paymentMethodInput = String(query.paymentMethod ?? "").trim();
  const paymentMethod = paymentMethodInput
    ? mapPaymentMethodFromLabel(paymentMethodInput)
    : undefined;

  const status = mapBookingStatusToEnum(query.status);

  const minAmount = parseNumber(query.minAmount) ?? undefined;
  const maxAmount = parseNumber(query.maxAmount) ?? undefined;

  const sortOrderRaw = String(query.sortOrder ?? "DESC").toUpperCase();
  const finalSortOrder = sortOrderRaw === "ASC" ? "ASC" : "DESC";
  const sortByRaw = String(query.sortBy ?? "bookingDate").trim();
  const sortMap: Record<BookingSortKey, BookingOrder> = {
    bookingId: [["id", finalSortOrder]],
    serviceName: [["service", "name", finalSortOrder]],
    serviceType: [["serviceType", "name", finalSortOrder]],
    assignedExpert: [["servicePartner", "user", "name", finalSortOrder]],
    dateTime: [["bookingDate", finalSortOrder]],
    amount: [["amount", finalSortOrder]],
    paymentMethod: [["payment", "paymentMethod", finalSortOrder]],
    bookingStatus: [["status", finalSortOrder]],
  };
  const orderArray: BookingOrder =
    sortMap[sortByRaw as BookingSortKey] ?? sortMap.dateTime;
  const hasDate = Boolean(date);
  const hasTime = Boolean(time);

  // if (hasTime && !hasDate) {
  //   throw new ApiError(
  //     STATUS_CODE.BAD_REQUEST,
  //     MESSAGES.COMMON.TIME_ONLY_WITH_DATE
  //   );
  // }

  if (hasDate && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.COMMON.INVALID_DATE_FORMAT
    );
  }

  if (hasTime && !/^(\d{1,2}):(\d{2})$/.test(time)) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.COMMON.INVALID_TIME_FORMAT
    );
  }

  const whereCondition: any = {
    userId: customerId,
  };

  if (status) whereCondition.status = status;
  if (minAmount || maxAmount) {
    whereCondition.amount = {
      ...(minAmount && { [Op.gte]: Number(minAmount) }),
      ...(maxAmount && { [Op.lte]: Number(maxAmount) }),
    };
  }

  const andConditions: any[] = [];
  if (hasDate) {
    andConditions.push(
      where(
        fn(
          "DATE",
          sequelize.literal("booking_date AT TIME ZONE 'Asia/Kolkata'")
        ),
        date
      )
    );
  }

  if (hasTime) {
    const [hours, minutes] = time.split(":").map(Number);
    andConditions.push(
      sequelize.where(
        sequelize.fn(
          "EXTRACT",
          sequelize.literal(
            "HOUR FROM booking_date AT TIME ZONE 'Asia/Kolkata'"
          )
        ),
        hours
      ),
      sequelize.where(
        sequelize.fn(
          "EXTRACT",
          sequelize.literal(
            "MINUTE FROM booking_date AT TIME ZONE 'Asia/Kolkata'"
          )
        ),
        minutes
      )
    );
  }
  if (andConditions.length) {
    whereCondition[Op.and] = andConditions;
  }

  const { rows, count } =
    await AdminCustomerRepository.findAllCustomerBookingServices(
      limit,
      offset,
      whereCondition,
      orderArray,
      serviceType,
      paymentMethod
    );

  // Collect all unique service type IDs from assigned partners and bulk-fetch their names
  const allServiceTypeIds: number[] = [
    ...new Set(
      rows.flatMap((b: BookingWithRelations) =>
        Array.isArray((b.servicePartner as any)?.serviceTypeIds)
          ? (b.servicePartner as any).serviceTypeIds
          : []
      ).filter((id: any) => typeof id === "number")
    ),
  ];

  let serviceTypeMap: Record<number, string> = {};
  if (allServiceTypeIds.length > 0) {
    const serviceTypes = await ServiceType.findAll({
      where: { id: { [Op.in]: allServiceTypeIds } },
      attributes: ["id", "name"],
      raw: true,
    });
    serviceTypeMap = Object.fromEntries(
      (serviceTypes as any[]).map((st) => [st.id, st.name])
    );
  }

  const formattedBookings: CustomerBookingServices[] = rows.map(
    (b: BookingWithRelations) => ({
      bookingId: b.id,

      serviceId: b.service?.id ?? null,
      serviceName: b.service?.name ?? null,
      serviceType: b.serviceType?.name ?? null,
      serviceAddress: b.serviceAddress ?? null,

      dateTime: b.bookingDate
        ? formatDateTimeDetail(b.bookingDate as Date, {
            includeYear: true,
            includeComma: false,
          })
        : "",

      bookingStatus: b.status,

      paymentStatus: b.payment?.paymentStatus ?? null,
      paymentMethod: b.payment?.paymentMethod ?? "Unknown",

      amount: b.amount ?? 0,

      assignedExpert:
        b.servicePartner?.verificationStatus === VerificationStatus.VERIFIED
          ? {
            id: b.servicePartner.id,
            name: b.servicePartner.user?.name ?? null,
            profileImage: b.servicePartner.user?.profileImage ?? null,
            mobileNumber: b.servicePartner.user?.mobileNumber ?? null,
            verificationStatus: b.servicePartner.verificationStatus,
            serviceTypes: (Array.isArray((b.servicePartner as any)?.serviceTypeIds)
              ? (b.servicePartner as any).serviceTypeIds
              : []
            ).map((id: number) => ({
              id,
              name: serviceTypeMap[id] ?? "",
            })).filter((st: { id: number; name: string }) => st.name),
          }
          : null,
    })
  );

  return {
    bookings: formattedBookings,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
    },
  };
};
