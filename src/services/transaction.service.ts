import {
  ITransaction,
  ITransactionFilter,
  ITransactionDetails,
} from "../interfaces/transaction.interface";
import { ApiError } from "../utils/apiError.util";
import logger from "../utils/logger";
import { Payment, User, Service, Booking } from "../models";
import { PaymentAttributes } from "../models/payment.model";
import { Op, WhereOptions, OrderItem } from "sequelize";
import { PaymentMethod, PaymentStatus } from "@/enums/transaction.enum";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { CurrencySymbol } from "@/enums/log.enum";
import * as BookingRepository from "../repositories/booking.repository";
import * as TransactionRepository from "../repositories/transaction.repository";

interface PopulatedPayment extends Payment {
  user?: User;
  service?: Service;
  booking?: Booking;
}

const mapPaymentMethod = (dbValue: string): string => {
  if (dbValue === PaymentMethod.CARD) return "Credit Card";
  if (dbValue === PaymentMethod.CASH) return "Cash";
  return dbValue;
};

const mapToFrontendMethod = (
  frontendValue: string,
): PaymentMethod | undefined => {
  if (frontendValue === "Credit Card") return PaymentMethod.CARD;
  if (frontendValue === "Cash") return PaymentMethod.CASH;
  return undefined;
};

/**
 * Get all transactions with filtering, sorting, and pagination
 * @param filter Transaction filter options
 */
export const getAllTransactions = async (filter: ITransactionFilter) => {
  logger.info(`TransactionService: Fetching transactions with filter: ${JSON.stringify(filter)}`);

  const whereClause: WhereOptions<PaymentAttributes> = {};

  if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
    const totalAmountFilter: { [key: symbol]: number } = {};
    if (filter.minAmount !== undefined)
      totalAmountFilter[Op.gte] = filter.minAmount;
    if (filter.maxAmount !== undefined)
      totalAmountFilter[Op.lte] = filter.maxAmount;
    whereClause.totalAmount =
      totalAmountFilter as unknown as import("sequelize").WhereAttributeHash<
        string | number
      >;
  }

  if (filter.paymentMethod && filter.paymentMethod !== "all") {
    const dbMethod = mapToFrontendMethod(filter.paymentMethod);
    if (dbMethod) {
      whereClause.paymentMethod = dbMethod;
    }
  }

  // Sorting
  let orderResult: OrderItem[] = [];
  const sortBy = filter.sortBy || "createdAt";
  const sortOrder = (filter.sortOrder || "DESC") as "ASC" | "DESC";

  // Map "userName" to User.name for sorting
  if (sortBy === "userName") {
    orderResult = [[{ model: User, as: "user" }, "name", sortOrder]];
  } else if (sortBy === "serviceName") {
    orderResult = [[{ model: Service, as: "service" }, "name", sortOrder]];
  } else if (sortBy === "amount" || sortBy === "totalAmount") {
    orderResult = [["totalAmount", sortOrder]];
  } else {
    orderResult = [[sortBy, sortOrder]];
  }

  // Pagination
  const page = filter.page || 1;
  const limit = filter.limit || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await TransactionRepository.findLatestUserTransactions(
    whereClause,
    limit,
    offset,
    orderResult
  );

  const transactions: ITransaction[] = (rows as PopulatedPayment[]).map((p) => {
    const transactionId =
      p.paymentIntentId?.trim() ||
      p.sessionId?.trim() ||
      p.orderId?.trim() ||
      `TXN-${p.id}`;

    return {
      id: p.id.toString(),
      userId: p.user?.id.toString() || "",
      userName: p.user?.name || "Unknown",
      transactionId,
      mobileNumber: p.user?.mobileNumber || "N/A",
      serviceName: p.service?.name || "Unknown Service",
      amount: parseFloat(p.totalAmount),
      currency: p.currency || CurrencySymbol.USD,
      paymentMethod: mapPaymentMethod(p.paymentMethod),
      status: p.paymentStatus === PaymentStatus.PAID ? "Success" : "Pending",
      createdAt: p.createdAt,
    };
  });

  function getCountValue(count: number | { length: number }): number {
    if (typeof count === "number") return count;
    if (typeof count === "object" && count !== null && "length" in count)
      return count.length;
    return 0;
  }

  return {
    transactions,
    pagination: {
      totalItems: getCountValue(count),
      currentPage: page,
      totalPages: Math.ceil(getCountValue(count) / limit),
      limit,
    },
  };
};

/**
 * Get a transaction by ID
 * @param id Transaction ID
 */
export const getTransactionById = async (
  id: string,
): Promise<ITransactionDetails> => {
  logger.info(`TransactionService: Fetching transaction with ID: ${id}`);

  const paymentData = await TransactionRepository.findPaymentWithDetailsById(id);

  if (!paymentData) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.TRANSACTION.NOT_FOUND);
  }

  const payment = paymentData as PopulatedPayment;

  // Find other transactions by the same user
  const userPayments = await TransactionRepository.findPaymentsByUserId(payment.userId);

  // Reorder so current payment is first, then others by date
  const sortedPayments = (userPayments as PopulatedPayment[]).sort((a, b) => {
    if (a.id === payment.id) return -1;
    if (b.id === payment.id) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const otherTransactions = sortedPayments.map((p) => ({
    id: p.id.toString(),
    transactionId:
      p.paymentIntentId || p.sessionId || p.orderId || `TXN-${p.id}`,
    service: p.service?.name || "Unknown Service",
    amount: parseFloat(p.totalAmount),
    currency: p.currency || "USD",
    paymentMethod: mapPaymentMethod(p.paymentMethod),
  }));

  return {
    id: payment.id.toString(),
    userId: payment.user?.id.toString() || "",
    bookingId: payment.booking?.id?.toString() || "",
    invoiceNumber: BookingRepository.generateInvoiceNumber(Number(payment.booking?.id || 0)),
    userName: payment.user?.name || "Unknown",
    transactionId:
      payment.paymentIntentId ||
      payment.sessionId || payment.orderId ||
      `TXN-${payment.id}`,
    mobileNumber: payment.user?.mobileNumber || "N/A",
    serviceId: payment.serviceId.toString(),
    serviceName: payment.service?.name || "Unknown Service",
    amount: parseFloat(payment.totalAmount),
    currency: payment.currency || "USD",
    paymentType: "Service Payment",
    paymentMethod: mapPaymentMethod(payment.paymentMethod),
    dateTime:
      new Date(payment.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      new Date(payment.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }), // "27 Aug 2025 1:58 PM"
    otherTransactions,
  };
};

/**
 * Delete a transaction by ID
 * @param id Transaction ID
 */
export const deleteTransaction = async (id: string) => {
  logger.info(`TransactionService: Deleting transaction ID: ${id}`);

  const payment = await TransactionRepository.findPaymentById(id);

  if (!payment) {
    logger.warn(`Transaction not found ID: ${id}`);
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.TRANSACTION.NOT_FOUND);
  }

  await TransactionRepository.deletePayment(payment);

  return true;
};
