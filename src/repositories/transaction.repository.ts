import { Payment, User, Service, Booking } from "@/models";
import { Op, WhereOptions, OrderItem } from "sequelize";

/**
 * @name findLatestUserTransactions
 * @description
 * This function performs a two-step query to get the latest transaction for each user.
 * 1. It optionally filters for user IDs that have at least one transaction matching the provided criteria.
 * 2. It then fetches the single latest transaction for each of those users using a Postgres-specific DISTINCT ON.
 * @param whereClause Criteria to filter transactions (e.g., amount, payment method).
 * @param limit Number of records to return.
 * @param offset Number of records to skip.
 * @param order Sorting criteria.
 * @access Public
 */
export const findLatestUserTransactions = async (
  whereClause: WhereOptions,
  limit: number,
  offset: number,
  order: OrderItem[]
) => {
  let userIdsFilter: any = {};

  // Step 1: Find user IDs that have ANY transaction matching the filters
  if (Object.keys(whereClause).length > 0) {
    const matchingUsers = await Payment.findAll({
      attributes: ["userId"],
      where: whereClause,
      group: ["userId"],
    });
    const userIds = matchingUsers.map((m) => m.userId);
    
    // If filters were applied but no transactions match, return empty early
    if (userIds.length === 0) {
      return { count: 0, rows: [] };
    }
    
    userIdsFilter = { userId: { [Op.in]: userIds } };
  }

  // Step 2: For those users (or all users if no filter), find their LATEST transaction ID
  const finalWhereClause: any = {
    ...userIdsFilter,
    id: {
      [Op.in]: Payment.sequelize?.literal(`(
        SELECT DISTINCT ON (user_id) id
        FROM payments
        ORDER BY user_id, created_at DESC
      )`),
    },
  };

  return await Payment.findAndCountAll({
    where: finalWhereClause,
    include: [
      { model: User, as: "user", attributes: ["id", "name", "mobileNumber"] },
      { model: Service, as: "service", attributes: ["name"] },
      {
        model: Booking,
        as: "booking",
        attributes: ["id", "createdAt", "status"],
      },
    ],
    order,
    limit,
    offset,
  });
};

/**
 * @name findPaymentWithDetailsById
 * @description
 * Fetches a single payment record by its primary key, including related user, service, and booking data.
 * @param id The payment ID.
 * @access Public
 */
export const findPaymentWithDetailsById = async (id: string | number) => {
  return await Payment.findByPk(id, {
    include: [
      { model: User, as: "user", attributes: ["id", "name", "mobileNumber"] },
      { model: Service, as: "service", attributes: ["id", "name"] },
      {
        model: Booking,
        as: "booking",
        attributes: ["id", "createdAt", "status"],
      },
    ],
  });
};

/**
 * @name findPaymentsByUserId
 * @description
 * Retrieves all payment records associated with a specific user, ordered by creation date.
 * @param userId The user's unique identifier.
 * @access Public
 */
export const findPaymentsByUserId = async (userId: number | string) => {
  return await Payment.findAll({
    where: { userId },
    include: [{ model: Service, as: "service", attributes: ["name"] }],
    order: [["createdAt", "DESC"]],
  });
};

/**
 * @name findPaymentById
 * @description
 * A simple lookup to find a payment by its primary key.
 * @param id The payment ID.
 * @access Public
 */
export const findPaymentById = async (id: string | number) => {
  return await Payment.findByPk(id);
};

/**
 * @name deletePayment
 * @description
 * Standard deletion wrapper for the Payment model.
 * @param payment The payment model instance to destroy.
 * @access Public
 */
export const deletePayment = async (payment: Payment) => {
  return await payment.destroy();
};
