import { Op } from "sequelize";
import sequelize from "../configs/db";
import { AdminCustomerFilterQuery } from "@/interfaces/adminCustomer.interface";
import { ApiError } from "@/utils/apiError.util";
import logger from "../utils/logger";
import { UserRole } from "@/enums/userRole.enum";
import { BookingStatus } from "@/enums/transaction.enum";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import * as AdminCustomerRepository from "@/repositories/adminCustomer.repository";

export const listCustomers = async (query: AdminCustomerFilterQuery) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(query.limit || 10)));
  const offset = (page - 1) * limit;

  // Resolve "CUSTOMER" role name → role_id (cached after first call)
  const customerRoleId = await AdminCustomerRepository.resolveRoleId(UserRole.CUSTOMER);

  const where: any = { roleId: customerRoleId };

  // Search by name, email, or mobile number
  if (query.search?.trim()) {
    const search = `%${query.search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: search } },
      { email: { [Op.iLike]: search } },
      { mobileNumber: { [Op.iLike]: search } },
    ];
  }

  if (query.status !== undefined) {
    where.isActive = query.status === "active";
  }

  // Booking count filtering
  if (query.minBookings !== undefined && query.minBookings !== "") {
    const min = Number(query.minBookings);
    if (min > 0) {
      const qualifyingUserIds = await AdminCustomerRepository.findUserIdsWithMinBookings(min);

      if (qualifyingUserIds.length === 0) {
        return { data: [], pagination: { currentPage: page, limit, totalItems: 0, totalPages: 0 } };
      }
      where.id = { [Op.in]: qualifyingUserIds };
    }
  }

  if (query.maxBookings !== undefined && query.maxBookings !== "") {
    const max = Number(query.maxBookings);
    const violatingUserIds = await AdminCustomerRepository.findUserIdsExceedingMaxBookings(max);

    if (violatingUserIds.length > 0) {
      if (where.id && where.id[Op.in]) {
        where.id[Op.in] = where.id[Op.in].filter((id: number) => !violatingUserIds.includes(id));
        if (where.id[Op.in].length === 0) {
          return { data: [], pagination: { currentPage: page, limit, totalItems: 0, totalPages: 0 } };
        }
      } else {
        where.id = { [Op.notIn]: violatingUserIds };
      }
    }
  }

  // Sorting
  const allowedSortFields = ["id", "name", "email", "createdAt", "isActive", "mobileNumber", "totalBookings", "pendingBookings"];
  const sortOrder = query.sortOrder === "ASC" ? "ASC" : "DESC";

  let order: any[];
  if (query.sortBy === "totalBookings") {
    order = [[sequelize.literal(`(SELECT COUNT(*) FROM bookings WHERE bookings.user_id = "User"."id")`), sortOrder]];
  } else if (query.sortBy === "pendingBookings") {
    order = [[sequelize.literal(`(SELECT COUNT(*) FROM bookings WHERE bookings.user_id = "User"."id" AND bookings.status = '${BookingStatus.PENDING}'::"enum_bookings_status")`), sortOrder]];
  } else {
    const sortBy = allowedSortFields.includes(query.sortBy || "")
      ? query.sortBy === "status" ? "isActive" : query.sortBy
      : "createdAt";
    order = [[sortBy as string, sortOrder]];
  }

  logger.info(
    `AdminCustomerService: Fetching customers with page: ${page}, limit: ${limit}, filtering: ${JSON.stringify(
      where
    )}, sorting: ${query.sortBy || "createdAt"} ${sortOrder}`
  );

  const { rows, count: totalItems } = await AdminCustomerRepository.findAllCustomers({
    where,
    limit,
    offset,
    order,
  });

  // Fetch booking counts for the retrieved users
  const userIds = rows.map((u: any) => u.id);

  let totalMap: Record<number, number> = {};
  let pendingMap: Record<number, number> = {};

  if (userIds.length > 0) {
    [totalMap, pendingMap] = await Promise.all([
      AdminCustomerRepository.findTotalBookingCountsByUserIds(userIds),
      AdminCustomerRepository.findPendingBookingCountsByUserIds(userIds),
    ]);
  }

  const data = rows.map((user: any) => {
    const userJson = user.toJSON();
    return {
      ...userJson,
      totalBookings: totalMap[user.id] || 0,
      pendingBookings: pendingMap[user.id] || 0,
    };
  });

  return {
    data,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const createCustomer = async (payload: {
  name: string;
  email: string;
  mobileNumber: string;
}) => {
  const { name, email, mobileNumber } = payload;

  const existing = await AdminCustomerRepository.findCustomerByEmailOrMobile(email, mobileNumber);

  if (existing) {
    const isDeleted = existing.deletedAt !== null;

    if (existing.email === email) {
      throw new ApiError(STATUS_CODE.CONFLICT, isDeleted
        ? MESSAGES.CUSTOMER.ALREADY_EMAIL_EXISTS_DEACTIVATED
        : MESSAGES.CUSTOMER.EMAIL_EXISTS);
    }
    if (existing.mobileNumber === mobileNumber) {
      throw new ApiError(STATUS_CODE.CONFLICT, isDeleted
        ? MESSAGES.CUSTOMER.ALREADY_MOBILE_EXISTS_DEACTIVATED
        : MESSAGES.CUSTOMER.MOBILE_EXISTS);
    }
  }

  // Resolve role id once
  const customerRoleId = await AdminCustomerRepository.resolveRoleId(UserRole.CUSTOMER);

  const customer = await AdminCustomerRepository.createCustomer({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    mobileNumber: mobileNumber.trim(),
    roleId: customerRoleId,
    isActive: true,
  });

  logger.info(`AdminCustomerService: New customer created with id: ${customer.id}`);

  const data = customer.toJSON() as { password?: string; rememberToken?: string; [key: string]: any };
  delete data.password;
  delete data.rememberToken;
  return data;
};

export const updateCustomerStatus = async (id: string, isActive: boolean) => {
  const customerRoleId = await AdminCustomerRepository.resolveRoleId(UserRole.CUSTOMER);
  const customer = await AdminCustomerRepository.findCustomerByIdAndRoleId(id, customerRoleId);

  if (!customer) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.CUSTOMER.NOT_FOUND);
  }

  await customer.update({ isActive });

  logger.info(`AdminCustomerService: Customer ${id} status updated to ${isActive ? "Active" : "Blocked"}`);

  const data = customer.toJSON() as { password?: string; rememberToken?: string; [key: string]: any };
  delete data.password;
  delete data.rememberToken;
  return data;
};

export const deleteCustomer = async (id: string) => {
  const customerRoleId = await AdminCustomerRepository.resolveRoleId(UserRole.CUSTOMER);
  const customer = await AdminCustomerRepository.findCustomerByIdAndRoleId(id, customerRoleId);

  if (!customer) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.CUSTOMER.NOT_FOUND);
  }

  await customer.destroy(); // Soft delete (paranoid: true)

  logger.info(`AdminCustomerService: Customer ${id} soft deleted successfully`);
};
