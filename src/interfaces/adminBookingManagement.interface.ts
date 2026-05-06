import { Booking, Payment } from "@/models";

export type BookingDetailStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

export type BookingRowStatus =
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type BookingDetailRow = {
  bookingId: string;
  serviceId: string;
  service: string;
  serviceType: string;
  dateTime: string;
  assignedExpert: string;
  assignedExpertId?: number;
  assignedExpertAvatar?: string;
  status: BookingDetailStatus;
  cancellationReason?: string;
  assignedExpertMobileNumber: string;
};

export type BookingCustomerRow = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  totalBookings: number;
  address: string;
  lastBookingDate: string;
  totalAmount: string;
  paymentMethod: string;
  status: BookingRowStatus;
  details: BookingDetailRow[];
};

export type Pagination = {
  totalItems: number;
  currentPage: number;
  limit: number;
  totalPages: number;
};

export type BookingGroupRowRaw = {
  customer_id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  group_date: string;
  payment_method: string;
  total_bookings: number | string;
  total_amount: string;
  last_booking_date: string;
  last_created_at: string;
};

export type BookingDetailRowRaw = {
  id: number | string | null;
  serviceId: number | string | null;
  serviceTypeId: number | string | null;
  userId: number | string | null;
  servicePartnerId: number | string | null;
  bookingDate: string;
  serviceAddress: string;
  status: string;
  group_date: string;
  cancellation_reason?: string;
  service?: { name?: string };
  serviceType?: { name?: string };
  servicePartner?: {
    profileImage?: string;
    user?: { name?: string; mobileNumber?: string; profileImage?: string };
  };
};

export type BookingWithPayment = Booking & {
  payment?: Payment;
};