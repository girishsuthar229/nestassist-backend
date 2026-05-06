import { Op, type Includeable, type WhereOptions } from "sequelize";
import sequelize from "@/configs/db";
import { Category, ServiceType, SubCategory, User, Payment } from "@/models";
import { ApiError } from "@/utils/apiError.util";
import { MESSAGES } from "@/constants/messages";
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/enums/transaction.enum";
import type {
  BookingCustomerRow,
  BookingDetailRow,
  BookingDetailRowRaw,
  BookingGroupRowRaw,
  BookingWithPayment,
  Pagination,
} from "@/interfaces/adminBookingManagement.interface";
export type { BookingCustomerRow } from "@/interfaces/adminBookingManagement.interface";
import {
  computeRowStatus,
  formatDateShort,
  formatDateTimeDetail,
  formatMoneyUsdLike,
  mapPaymentMethodFromLabel,
  mapPaymentMethodToLabel,
  normalizeGroupStatusInput,
  normalizeStatusInput,
  parseNumber,
  toDetailStatus,
} from "@/utils/adminBookingManagement.util";
import { logServiceProviderChanged } from "./logger/serviceProvider.logger";
import { ServicePartnerWithUser } from "@/dtos/servicePartner.dto";
import { STATUS_CODE } from "@/enums";
import {
  ServicePartnerStatus,
  VerificationStatus,
} from "@/enums/servicePartner.enum";
import { adminBookingManagementRepository } from "@/repositories/adminBookingManagement.repository";
import { logBookingStatusChanged } from "./logger/booking.logger";
import { getAvailablePartner } from "./serviceBookingCheckout.service";
import { serviceAdminRepository } from "@/repositories/serviceAdmin.repository";

/**
 * @name getAdminBookings
 * @description Builds a grouped/paginated admin booking list with filtering, sorting, and aggregated booking counts/amounts.
 * @access Private
 */
export const getAdminBookings = async (query: Record<string, unknown>) => {
  const page = parseNumber(query.page) ?? 1;
  const limit = parseNumber(query.limit) ?? 10;
  const offset = (page - 1) * limit;

  const q = String(query.q ?? "").trim();
  const serviceType = String(
    query.serviceType ?? query.service_type ?? query.serviceTypeName ?? "",
  ).trim();
  const date = String(query.date ?? "").trim(); // yyyy-MM-dd
  const time = String(query.time ?? "").trim(); // HH:mm

  const paymentMethodInput = String(query.paymentMethod ?? "").trim();
  const paymentMethod = paymentMethodInput
    ? mapPaymentMethodFromLabel(paymentMethodInput)
    : undefined;

  const statusFilter = normalizeGroupStatusInput(query.status);

  const bookedMin = parseNumber(query.bookedMin) ?? undefined;
  const bookedMax = parseNumber(query.bookedMax) ?? undefined;
  const amountMin = parseNumber(query.amountMin) ?? undefined;
  const amountMax = parseNumber(query.amountMax) ?? undefined;

  const sortByRaw = String(query.sortBy ?? "last_created_at").trim();
  const sortOrder = String(query.sortOrder ?? "DESC").toUpperCase();
  const sortOrderSafe = sortOrder === "ASC" ? "ASC" : "DESC";

  const allowedSortBy = new Set([
    "last_booking_date",
    "last_created_at",
    "total_amount",
    "total_bookings",
    "customer_name",
  ]);
  const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : "last_created_at";

  const hasDate = Boolean(date);
  const hasTime = Boolean(time);

  if (hasTime && !hasDate) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.COMMON.TIME_ONLY_WITH_DATE,
    );
  }
  if (hasDate && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.COMMON.INVALID_DATE_FORMAT,
    );
  }
  if (hasTime && !/^(\d{1,2}):(\d{2})$/.test(time)) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.COMMON.INVALID_TIME_FORMAT,
    );
  }

  const bookingWhere: Record<string, unknown> = {};
  if (hasDate) {
    const [year, month, day] = date.split("-").map(Number);
    const endDate = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
    if (hasTime) {
      const [hours, minutes] = time.split(":").map(Number);
      bookingWhere.bookingDate = {
        [Op.gte]: new Date(year, month - 1, day, hours, minutes, 0, 0),
        [Op.lt]: endDate,
      };
    } else {
      const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      bookingWhere.bookingDate = { [Op.gte]: startDate, [Op.lt]: endDate };
    }
  }

  const customerWhere = q
    ? {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { mobileNumber: { [Op.iLike]: `%${q}%` } },
        ],
      }
    : undefined;

  const includeForGroups: Includeable[] = [
    {
      model: User,
      as: "customer",
      attributes: [],
      required: true,
      where: customerWhere,
    },
    {
      model: Payment,
      as: "payment",
      attributes: [],
      required: Boolean(paymentMethod),
      where: paymentMethod ? { paymentMethod } : undefined,
    },
    {
      model: ServiceType,
      as: "serviceType",
      attributes: [],
      required: Boolean(serviceType),
      where: serviceType ? { name: { [Op.iLike]: serviceType } } : undefined,
    },
  ];

  const groupDateExpr = sequelize.fn(
    "DATE",
    sequelize.col("Booking.booking_date"),
  );
  const totalBookingsExpr = sequelize.fn("COUNT", sequelize.col("Booking.id"));
  const totalAmountExpr = sequelize.fn(
    "COALESCE",
    sequelize.fn("SUM", sequelize.col("Booking.amount")),
    0,
  );
  const lastBookingDateExpr = sequelize.fn(
    "MAX",
    sequelize.col("Booking.booking_date"),
  );

  const enumType = `"enum_bookings_status"`;
  const cancelledCountExpr = sequelize.fn(
    "SUM",
    sequelize.literal(
      `CASE WHEN "Booking"."status" = '${BookingStatus.CANCELLED}'::${enumType} THEN 1 ELSE 0 END`,
    ),
  );
  const completedCountExpr = sequelize.fn(
    "SUM",
    sequelize.literal(
      `CASE WHEN "Booking"."status" = '${BookingStatus.COMPLETED}'::${enumType} THEN 1 ELSE 0 END`,
    ),
  );
  const pendingCountExpr = sequelize.fn(
    "SUM",
    sequelize.literal(
      `CASE WHEN "Booking"."status" = '${BookingStatus.PENDING}'::${enumType} THEN 1 ELSE 0 END`,
    ),
  );
  const lastCreatedAtExpr = sequelize.fn(
    "MAX",
    sequelize.col("Booking.created_at"),
  );

  const groupBy = [
    sequelize.col("customer.id"),
    sequelize.col("customer.name"),
    sequelize.col("customer.email"),
    sequelize.col("customer.mobile_number"),
    sequelize.col("Booking.service_address"),
    groupDateExpr,
  ];

  const having: Array<ReturnType<typeof sequelize.where>> = [];
  if (typeof bookedMin === "number")
    having.push(sequelize.where(totalBookingsExpr, Op.gte, bookedMin));
  if (typeof bookedMax === "number")
    having.push(sequelize.where(totalBookingsExpr, Op.lte, bookedMax));
  if (typeof amountMin === "number")
    having.push(sequelize.where(totalAmountExpr, Op.gte, amountMin));
  if (typeof amountMax === "number")
    having.push(sequelize.where(totalAmountExpr, Op.lte, amountMax));

  if (statusFilter === "Cancelled") {
    having.push(sequelize.where(cancelledCountExpr, Op.eq, totalBookingsExpr));
  } else if (statusFilter === "Completed") {
    having.push(sequelize.where(completedCountExpr, Op.eq, totalBookingsExpr));
  } else if (statusFilter === "Pending") {
    having.push(sequelize.where(pendingCountExpr, Op.eq, totalBookingsExpr));
  } else if (statusFilter === "In Progress") {
    having.push(sequelize.where(cancelledCountExpr, Op.lt, totalBookingsExpr));
    having.push(sequelize.where(completedCountExpr, Op.lt, totalBookingsExpr));
    having.push(sequelize.where(pendingCountExpr, Op.lt, totalBookingsExpr));
  }

  const orderExpr =
    sortBy === "customer_name"
      ? sequelize.col("customer.name")
      : sortBy === "total_amount"
        ? totalAmountExpr
        : sortBy === "total_bookings"
          ? totalBookingsExpr
          : sortBy === "last_created_at"
            ? lastCreatedAtExpr
            : lastBookingDateExpr;

  const groupedRows =
    (await adminBookingManagementRepository.getGroupedBookings({
      where: bookingWhere,
      include: includeForGroups,
      groupBy,
      having: having.length
        ? ({ [Op.and]: having } as unknown as WhereOptions)
        : undefined,
      orderExpr,
      sortOrder: sortOrderSafe,
      limit,
      offset,
      attributes: [
        [sequelize.col("customer.id"), "customer_id"],
        [sequelize.col("customer.name"), "customer_name"],
        [sequelize.col("customer.email"), "email"],
        [sequelize.col("customer.mobile_number"), "phone"],
        [sequelize.col("Booking.service_address"), "address"],
        [groupDateExpr, "group_date"],
        [
          sequelize.fn("MIN", sequelize.col("payment.payment_method")),
          "payment_method",
        ],
        [totalBookingsExpr, "total_bookings"],
        [totalAmountExpr, "total_amount"],
        [lastBookingDateExpr, "last_booking_date"],
        [lastCreatedAtExpr, "last_created_at"],
      ],
    })) as unknown as BookingGroupRowRaw[];

  const totalItems =
    await adminBookingManagementRepository.countGroupedBookings({
      where: bookingWhere,
      include: includeForGroups,
      groupBy,
      having: having.length
        ? ({ [Op.and]: having } as unknown as WhereOptions)
        : undefined,
    });

  if (groupedRows.length === 0) {
    return {
      rows: [],
      pagination: {
        totalItems: Number(totalItems) || 0,
        currentPage: page,
        limit,
        totalPages: 0,
      },
    };
  }

  const groupOr = groupedRows.map((r) => ({
    userId: Number(r.customer_id),
    serviceAddress: String(r.address ?? ""),
    [Op.and]: [
      sequelize.where(
        sequelize.fn("DATE", sequelize.col("Booking.booking_date")),
        Op.eq,
        String(r.group_date).slice(0, 10),
      ),
    ],
  }));

  const details = (await adminBookingManagementRepository.getBookingDetails(
    groupOr,
    serviceType,
    paymentMethod,
  )) as unknown as BookingDetailRowRaw[];

  const byGroup: Record<string, BookingCustomerRow> = {};

  for (const r of groupedRows) {
    const customerId = String(r.customer_id);
    const groupDate = r.group_date ? String(r.group_date).slice(0, 10) : "";
    const address = String(r.address ?? "");
    const key = `${customerId}::${groupDate}::${address}`;
    const lastBookingDate = r.last_booking_date
      ? formatDateShort(new Date(String(r.last_booking_date)))
      : "";
    const totalAmountNum = Number(r.total_amount) || 0;

    byGroup[key] = {
      id: key,
      customerName: String(r.customer_name ?? ""),
      phone: String(r.phone ?? ""),
      email: String(r.email ?? ""),
      totalBookings: Number(r.total_bookings ?? 0),
      address,
      lastBookingDate,
      totalAmount: formatMoneyUsdLike(totalAmountNum),
      paymentMethod: mapPaymentMethodToLabel(String(r.payment_method ?? "")),
      status: "Pending",
      details: [],
    };
  }

  for (const d of details) {
    const customerId = String(d.userId);
    const groupDate = d.group_date ? String(d.group_date).slice(0, 10) : "";
    const address = String(d.serviceAddress ?? "");
    const key = `${customerId}::${groupDate}::${address}`;
    if (!byGroup[key]) continue;

    const bookingDate = d.bookingDate
      ? new Date(String(d.bookingDate))
      : undefined;
    const detail: BookingDetailRow = {
      bookingId: String(d.id),
      serviceId: String(d.serviceId),
      service: String(d.service?.name ?? ""),
      serviceType: String(d.serviceType?.name ?? ""),
      dateTime: bookingDate
        ? formatDateTimeDetail(bookingDate as Date, { includeYear: true })
        : "",
      assignedExpert: String(d.servicePartner?.user?.name ?? "Unknown"),
      assignedExpertMobileNumber: String(
        d.servicePartner?.user?.mobileNumber ?? "",
      ),
      assignedExpertId:
        d.servicePartnerId !== null && d.servicePartnerId !== undefined
          ? Number(d.servicePartnerId)
          : undefined,
      assignedExpertAvatar:
        d.servicePartner?.user?.profileImage !== null &&
        d.servicePartner?.user?.profileImage !== undefined
          ? String(d.servicePartner?.user?.profileImage)
          : undefined,
      status: toDetailStatus(String(d.status ?? BookingStatus.PENDING)),
      cancellationReason:
        d.cancellation_reason !== null && d.cancellation_reason !== undefined
          ? String(d.cancellation_reason)
          : undefined,
    };

    byGroup[key].details.push(detail);
  }

  for (const group of Object.values(byGroup)) {
    group.status = computeRowStatus(group.details);
    group.totalBookings = group.details.length;
  }

  const finalRows: BookingCustomerRow[] = groupedRows.map((r) => {
    const customerId = String(r.customer_id);
    const groupDate = r.group_date ? String(r.group_date).slice(0, 10) : "";
    const address = String(r.address ?? "");
    const key = `${customerId}::${groupDate}::${address}`;
    return byGroup[key];
  });

  const totalPages = limit > 0 ? Math.ceil(Number(totalItems) / limit) : 0;

  return {
    rows: finalRows,
    pagination: {
      totalItems: Number(totalItems),
      currentPage: page,
      limit,
      totalPages,
    } satisfies Pagination,
  };
};

/**
 * @name getAdminBookingFilters
 * @description Returns filter options used by admin booking screens (service types, payment methods, booking statuses).
 * @access Private
 */
export const getAdminBookingFilters = async () => {
  const serviceTypes = await adminBookingManagementRepository.getServiceTypes();

  return {
    serviceTypes: serviceTypes
      .map((entry) => String((entry as { name?: unknown }).name))
      .filter(Boolean),
    paymentMethods: Object.values(PaymentMethod),
    bookingStatuses: Object.values(BookingStatus),
  };
};

/**
 * @name updateBookingStatus
 * @description Validates and updates booking status (only for pending bookings); syncs the related payment record when present.
 * @access Private
 */
export const updateBookingStatus = async (
  bookingId: number,
  userId: number,
  status: unknown,
  cancellationReason?: unknown,
) => {
  if (!Number.isFinite(bookingId) || bookingId <= 0) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.BOOKING.INVALID_ID);
  }

  const mapped = normalizeStatusInput(status);
  const reason =
    typeof cancellationReason === "string"
      ? cancellationReason.trim()
      : undefined;

  const booking: BookingWithPayment | null =
    await adminBookingManagementRepository.findBookingById(bookingId);
  if (!booking)
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.BOOKING.NOT_FOUND);

  const currentStatus = booking.status as BookingStatus;
  // Only allow changes for pending bookings (PENDING/CONFIRMED), not completed/cancelled.
  if (
    ![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(currentStatus)
  ) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.BOOKING.ONLY_PENDING_CAN_BE_UPDATED,
    );
  }

  const nextStatus = mapped;
  await adminBookingManagementRepository.updateBooking(booking, {
    status: nextStatus,
    ...(nextStatus === BookingStatus.CANCELLED
      ? { cancellationReason: reason ?? null }
      : {}),
  });

  await logBookingStatusChanged({
    bookingId: booking.id,
    userId: userId,
    serviceId: booking.serviceId,
    oldStatus: currentStatus,
    newStatus: nextStatus,
  });

  const payment = booking.payment;

  if (payment) {
    const isCOD = payment.paymentMethod === PaymentMethod.CASH;
    const isOnline = !isCOD;

    let paymentUpdate: Partial<Payment> = {
      bookingStatus: nextStatus,
    };

    // ================= COMPLETED =================
    if (nextStatus === BookingStatus.COMPLETED) {
      if (isCOD) {
        paymentUpdate.paymentStatus = PaymentStatus.PAID;
        paymentUpdate.paidAt = new Date();
      }
    }

    // ================= CANCELLED =================
    if (nextStatus === BookingStatus.CANCELLED) {
      if (isOnline && payment.paymentStatus === PaymentStatus.PAID) {
        paymentUpdate.paymentStatus = PaymentStatus.REFUNDED;
      }
    }

    await adminBookingManagementRepository.updatePayment(
      { id: booking.paymentId },
      paymentUpdate,
    );
  }

  return { bookingId, status: nextStatus };
};

/**
 * @name deleteBooking
 * @description Deletes a booking record by id.
 * @access Private
 */
export const deleteBooking = async (bookingId: number) => {
  if (!Number.isFinite(bookingId) || bookingId <= 0) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.BOOKING.INVALID_ID);
  }

  const booking =
    await adminBookingManagementRepository.findBookingById(bookingId);
  if (!booking)
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.BOOKING.NOT_FOUND);

  await adminBookingManagementRepository.deleteBooking(bookingId);
};

/**
 * @name changeBookingExpert
 * @description Reassigns a booking to a different expert; validates status and service-type match and logs the change.
 * @access Private
 */
export const changeBookingExpert = async (
  bookingId: number,
  servicePartnerId: number,
  userId?: number,
) => {
  if (!Number.isFinite(bookingId) || bookingId <= 0) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.BOOKING.INVALID_ID);
  }
  if (!Number.isFinite(servicePartnerId) || servicePartnerId <= 0) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.EXPERT.INVALID_SERVICE_PARTNER_ID,
    );
  }

  const booking =
    await adminBookingManagementRepository.findBookingById(bookingId);
  if (!booking)
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.BOOKING.NOT_FOUND);

  const currentStatus = booking.status as BookingStatus;
  // Only allow reassignment while booking is pending (PENDING/CONFIRMED).
  if (
    ![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(currentStatus)
  ) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.BOOKING.ONLY_PENDING_CAN_CHANGE_EXPERT,
    );
  }

  const [newExpert, oldExpert] = await Promise.all([
    adminBookingManagementRepository.findServicePartnerWithUser(
      servicePartnerId,
    ),
    booking.servicePartnerId
      ? adminBookingManagementRepository.findServicePartnerWithUser(
          booking.servicePartnerId,
        )
      : null,
  ]);

  if (!newExpert)
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.EXPERT.NOT_FOUND);
  const newExpertEmail =
    (newExpert as ServicePartnerWithUser)?.user?.email ?? "";
  const oldExpertEmail =
    (oldExpert as ServicePartnerWithUser)?.user?.email ?? "";

  // Validate that the expert belongs to the same service type as the booked service.
  // ServicePartner.serviceTypeId is used as the mapping source.
  let serviceTypeId = booking.serviceTypeId;
  if (!serviceTypeId) {
    const service =
      await adminBookingManagementRepository.findServiceByIdWithRelations(
        booking.serviceId,
      );
    if (!service)
      throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SERVICE.NOT_FOUND);

    const subCategory = service.get("subCategory") as unknown as
      | (SubCategory & { get?: (key: string) => unknown })
      | null
      | undefined;
    const category = subCategory?.get?.("category") as unknown as
      | (Category & { get?: (key: string) => unknown })
      | null
      | undefined;
    const includedServiceType = category?.get?.("serviceType") as unknown as
      | ServiceType
      | null
      | undefined;

    serviceTypeId =
      typeof includedServiceType?.id === "number"
        ? includedServiceType.id
        : null;
    // Fallback for legacy/inconsistent data where sub_category_id join is missing.
    if (!serviceTypeId) {
      const categoryId = subCategory?.categoryId ?? service.categoryId;

      if (categoryId) {
        const category =
          await adminBookingManagementRepository.findCategoryWithServiceType(
            categoryId,
          );
        const serviceType = category?.get?.("serviceType") as unknown as
          | ServiceType
          | null
          | undefined;
        serviceTypeId =
          typeof serviceType?.id === "number" ? serviceType.id : null;
      }
    }

    if (serviceTypeId) {
      await adminBookingManagementRepository.updateBooking(booking, {
        serviceTypeId: Number(serviceTypeId),
      });
    }
  }
  if (!serviceTypeId)
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.BOOKING.CANNOT_RESOLVE_SERVICE_TYPE,
    );

  if (
    !Array.isArray(newExpert.serviceTypeIds) ||
    !newExpert.serviceTypeIds.includes(Number(serviceTypeId))
  ) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.BOOKING.EXPERT_SERVICE_TYPE_MISMATCH,
    );
  }

  await adminBookingManagementRepository.updateBooking(booking, {
    servicePartnerId,
  });

  const message = `Booking expert changed from ${
    oldExpertEmail || "previous expert"
  } to ${newExpertEmail || "new expert"} for booking id ${bookingId || "N/A"}`;
  await logServiceProviderChanged({
    bookingId,
    serviceId: booking.serviceId,
    userId: userId,
    message,
  });

  if (booking.paymentId) {
    await adminBookingManagementRepository.updatePayment(
      { id: booking.paymentId },
      { servicePartnerId },
    );
  }
};

/**
 * @name getVerifiedExpertsByBookingId
 * @description Returns verified/active experts for a given service type name (used by admin reassignment flow).
 * @access Private
 */
export const getVerifiedExpertsByBookingId = async (booking_id: string) => {
  if (!booking_id) return [];

  const booking = await adminBookingManagementRepository.findBookingById(
    Number(booking_id),
  );

  if (!booking) return [];

  const { serviceId, serviceDuration, bookingDate } = booking;

  const service = await serviceAdminRepository.getServiceById(serviceId);

  if (!service) return [];

  const experts = await getAvailablePartner({
    subCategoryId: service.subCategoryId,
    serviceId: serviceId,
    bookingDate: new Date(bookingDate),
    duration: Number(serviceDuration),
  });

  return (experts as unknown as ServicePartnerWithUser[]).map((p) => ({
    id: p.id,
    name: p.user?.name ?? "Unknown",
    avatar: p.user?.profileImage ?? undefined,
    verified:
      String(p.verificationStatus ?? "") === VerificationStatus.VERIFIED &&
      String(p.status ?? "") === ServicePartnerStatus.ACTIVE,
  }));
};
