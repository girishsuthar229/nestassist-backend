import { Transaction, FindOptions } from "sequelize";
import { Payment, Booking, Service, User } from "@/models";
import sequelize from "../configs/db";

/**
 * Finds a payment by its primary key.
 */
export const findPaymentById = async (id: number, options?: FindOptions) => {
  return await Payment.findByPk(id, options);
};

/**
 * Finds a booking by its primary key.
 */
export const findBookingById = async (id: number, options?: FindOptions) => {
  return await Booking.findByPk(id, options);
};

/**
 * Finds a service by its primary key.
 */
export const findServiceById = async (id: number) => {
  return await Service.findByPk(id);
};

/**
 * Finds a user by its primary key.
 */
export const findUserById = async (id: number) => {
  return await User.findByPk(id);
};

/**
 * Updates a payment record.
 */
export const updatePayment = async (
  payment: Payment,
  data: Partial<Payment>,
  transaction?: Transaction,
) => {
  return await payment.update(data, { transaction });
};

/**
 * Updates a booking record.
 */
export const updateBooking = async (
  booking: Booking,
  data: Partial<Booking>,
  transaction?: Transaction,
) => {
  return await booking.update(data, { transaction });
};

/**
 * Performs a transactional update of both booking and payment records.
 */
export const updateBookingAndPaymentWithTransaction = async (
  booking: Booking,
  payment: Payment,
  bookingData: Partial<Booking>,
  paymentData: Partial<Payment>,
) => {
  return await sequelize.transaction(async (transaction: Transaction) => {
    await booking.update(bookingData, { transaction });
    await payment.update(paymentData, { transaction });
  });
};
