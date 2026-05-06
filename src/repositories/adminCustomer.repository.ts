import { FindAndCountOptions, Op } from "sequelize";
import sequelize from "../configs/db";
import {
  Booking,
  Payment,
  Service,
  ServicePartner,
  ServiceType,
  User,
} from "../models";
import { BookingStatus } from "@/enums/transaction.enum";
import { getRoleIdByName } from "@/repositories/role.repository";

export type BookingWithRelations = Booking & {
  service?: Service;
  serviceType?: ServiceType;
  servicePartner?: ServicePartner & {
    user?: User;
  };
  payment?: Payment;
};

// ─────────────────────────────────────────────────────────────────────────────
// Role helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a role name to its DB id. Throws if the role is not found.
 */
export const resolveRoleId = async (roleName: string): Promise<number> => {
  const id = await getRoleIdByName(roleName);
  if (!id) throw new Error(`Role "${roleName}" not found in roles table`);
  return id;
};

// ─────────────────────────────────────────────────────────────────────────────
// Customer (User) queries
// ─────────────────────────────────────────────────────────────────────────────

export const findCustomerById = async (id: string | number) => {
  return await User.findByPk(id);
};

/**
 * Find a customer by email OR mobile number (for duplicate checks).
 * Includes soft-deleted records (paranoid: false).
 */
export const findCustomerByEmailOrMobile = async (
  email: string,
  mobileNumber: string
) => {
  return await User.findOne({
    where: {
      [Op.or]: [{ email }, { mobileNumber }],
    },
    paranoid: false,
  });
};

/**
 * Find a single customer by id and roleId (used for status update / delete).
 */
export const findCustomerByIdAndRoleId = async (id: string, roleId: number) => {
  return await User.findOne({ where: { id, roleId } });
};

/**
 * Paginated list of customers with search, status, and sort support.
 * Uses roleId (FK) instead of the removed `role` column.
 */
export const findAllCustomers = async (options: {
  where: any;
  limit: number;
  offset: number;
  order: any[];
}) => {
  return await User.findAndCountAll({
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
    subQuery: false,
    attributes: {
      exclude: ["password", "rememberToken"],
    },
  });
};

/**
 * Create a new customer user record.
 */
export const createCustomer = async (data: {
  name: string;
  email: string;
  mobileNumber: string;
  roleId: number;
  isActive: boolean;
}) => {
  return await User.create(data);
};

// ─────────────────────────────────────────────────────────────────────────────
// Booking count helpers (used for minBookings / maxBookings filtering)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return all userId values that have at least `min` bookings.
 */
export const findUserIdsWithMinBookings = async (min: number): Promise<number[]> => {
  const rows = await Booking.findAll({
    attributes: ["userId"],
    group: ["userId"],
    having: sequelize.where(sequelize.fn("COUNT", sequelize.col("id")), ">=", min),
  });
  return rows.map((b: Booking) => b.userId);
};

/**
 * Return all userId values that have MORE than `max` bookings (to exclude them).
 */
export const findUserIdsExceedingMaxBookings = async (max: number): Promise<number[]> => {
  const rows = await Booking.findAll({
    attributes: ["userId"],
    group: ["userId"],
    having: sequelize.where(sequelize.fn("COUNT", sequelize.col("id")), ">", max),
  });
  return rows.map((b: Booking) => b.userId);
};

/**
 * Returns a map of { userId → totalBookingCount } for the given user IDs.
 */
export const findTotalBookingCountsByUserIds = async (
  userIds: number[]
): Promise<Record<number, number>> => {
  const rows = await Booking.findAll({
    attributes: ["userId", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    where: { userId: { [Op.in]: userIds } },
    group: ["userId"],
  });
  return Object.fromEntries(
    rows.map((b: Booking) => [b.userId, Number(b.getDataValue("count"))])
  );
};

/**
 * Returns a map of { userId → pendingBookingCount } for the given user IDs.
 */
export const findPendingBookingCountsByUserIds = async (
  userIds: number[]
): Promise<Record<number, number>> => {
  const rows = await Booking.findAll({
    attributes: ["userId", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    where: { userId: { [Op.in]: userIds }, status: BookingStatus.PENDING },
    group: ["userId"],
  });
  return Object.fromEntries(
    rows.map((b: Booking) => [b.userId, Number(b.getDataValue("count"))])
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Booking (customer-bookings tab) queries
// ─────────────────────────────────────────────────────────────────────────────

export const findAllCustomerBookingServices = async (
  limit: number,
  offset: number,
  whereCondition: any,
  orderArray: any[],
  serviceType: string,
  paymentMethod?: string
): Promise<{ rows: BookingWithRelations[]; count: number }> => {
  const options: FindAndCountOptions = {
    where: whereCondition,

    include: [
      {
        model: ServiceType,
        as: "serviceType",
        attributes: ["id", "name"],
        required: !!serviceType,
        where: serviceType
          ? isNaN(Number(serviceType))
            ? { name: { [Op.iLike]: `%${serviceType}%` } }
            : { id: Number(serviceType) }
          : undefined,
      },
      {
        model: Service,
        as: "service",
        attributes: ["id", "name"],
      },
      {
        model: Payment,
        as: "payment",
        attributes: ["paymentMethod", "paymentStatus"],
        required: !!paymentMethod,
        where: paymentMethod ? { paymentMethod } : undefined,
      },
      {
        model: ServicePartner,
        as: "servicePartner",
        attributes: ["id", "verificationStatus", "serviceTypeIds"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["name", "profileImage", "mobileNumber"],
          },
        ],
      },
    ],
    order: orderArray,
    limit,
    offset,
    distinct: true,
  };

  const { rows, count } = await Booking.findAndCountAll(options);

  return {
    rows: rows as BookingWithRelations[],
    count,
  };
};
