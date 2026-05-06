import { BookingStatus, PaymentStatus } from "@/enums/transaction.enum";

export const INVOICE_PREFIX = "INV-";
export const INVOICE_BASE_NUM = 1000;
export const SLOT_START_MINUTES = 9 * 60; // 9:00 AM
export const SLOT_END_MINUTES = 19 * 60; // 7:00 PM
export const MAX_BUFFER_MINUTES = 60;
export const MIN_BOOKING_BEFORE_BUFFER = 30;
export const MIN_BOOKING_BEFORE_BUFFER_TIME = 30 * 60000;

export const EXPIRED_MINUTES = 10;
export const RETRIED_PAYMENT_STATUS = [
  PaymentStatus.FAILED,
  PaymentStatus.PENDING,
];
export const RETRIED_BOOKING_STATUS = [
  BookingStatus.CANCELLED,
  BookingStatus.PENDING,
];
