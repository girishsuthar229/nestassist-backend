import Booking from "../models/booking.model";
import Payment from "../models/payment.model";
import { Service, User } from "@/models";
import sequelize from "../configs/db";
import { BookingStatus, PaymentStatus } from "@/enums/transaction.enum";

/**
 * @name findPaymentByOrderId
 * @description
 * Finds a payment record in the database using the Razorpay order ID.
 * This is used to correlate Razorpay events with our internal payment records.
 * @access Private
 */
export const findPaymentByOrderId = async (orderId: string) => {
  return await Payment.findOne({
    where: { orderId: orderId },
  });
};

/**
 * @name findBookingByPaymentId
 * @description
 * Finds a booking record in the database using the associated payment ID.
 * This is used to correlate Razorpay events with our internal booking records after finding the payment record.
 * @access Private
 */
export const findBookingByPaymentId = async (paymentId: number) => {
  return await Booking.findOne({
    where: { paymentId: paymentId },
  });
};

/**
 * @name getServiceAndUserContext
 * @description
 * Fetches the service name and user email associated with a given service ID and user ID.
 * This is used to build contextual information for logging payment events, such as payment failures, to provide more meaningful log messages that include the service name and user email.
 * @access Private
 */
export const getServiceAndUserContext = async (
  serviceId: number,
  userId: number
) => {
  const [service, user] = await Promise.all([
    Service.findByPk(serviceId, { attributes: ["name"] }),
    User.findByPk(userId, { attributes: ["name", "email"] }),
  ]);
  return { service, user };
};

/**
 * @name updatePaymentAndBookingWithTransaction
 * @description
 * Performs a transactional update of both the payment and booking records. This ensures that both updates either succeed or fail together, maintaining data integrity.
 * The function takes the payment and booking instances along with their respective update data, and executes the updates within a single transaction.
 * @access Private
 */
export const updatePaymentAndBookingWithTransaction = async (
  payment: Payment,
  booking: Booking,
  paymentUpdate: {
    paymentStatus: PaymentStatus;
    bookingStatus: BookingStatus;
    paymentIntentId: string;
    paidAt: Date;
  },
  bookingUpdate: {
    status: string;
    cancellationReason?: string;
  }
) => {
  return await sequelize.transaction(async (transaction) => {
    await payment.update(paymentUpdate, { transaction });
    await booking.update(bookingUpdate, { transaction });
  });
};

/**
 * @name findPaymentById
 * @description
 * Finds a payment record in the database using its primary key ID.
 * @access Private
 */
export const findPaymentById = async (paymentId: number) => {
  return await Payment.findByPk(paymentId);
};

/**
 * @name findBookingById
 * @description
 * Finds a booking record in the database using its primary key ID.
 * @access Private
 */
export const findBookingById = async (bookingId: number) => {
  return await Booking.findByPk(bookingId);
};

/**
 * @name findServiceById
 * @description
 * Finds a service record in the database using its primary key ID and returns only the name attribute.
 * @access Private
 */
export const findServiceById = async (serviceId: number) => {
  return await Service.findByPk(serviceId, { attributes: ["name"] });
};
