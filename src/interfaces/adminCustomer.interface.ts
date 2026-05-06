import { IMetaPaginationResponse } from "@/dtos/apiResponse.dto";
import { BookingStatus, PaymentStatus } from "@/enums/transaction.enum";

export interface AdminCustomerFilterQuery {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
  status?: string; // "active" | "blocked" expected from frontend
  minBookings?: number | string;
  maxBookings?: number | string;
}
export interface AdminCustomerDetailFilterQuery {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  serviceType?: string;
  date?: string;
  time?: string;
  minAmount?: number | string;
  maxAmount?: number | string;
  paymentMethod?: string;
  status?: string;
  totalCount?: number | string;
}

export interface AdminUserFilterQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  status?: string;
  search?: string;
}

export interface AssignedExpert {
  id: number;
  name: string | null;
  profileImage: string | null;
  mobileNumber: string | null;
  verificationStatus: string;
  serviceTypes: {
    id: number;
    name: string;
  }[];
}

export interface CustomerBookingServices {
  bookingId: number;
  serviceId: number | null;
  serviceName: string | null;
  serviceType: string | null;
  serviceAddress: string | null;
  dateTime: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus | null;
  paymentMethod: string;
  amount: number;
  assignedExpert: AssignedExpert | null;
}
export interface CustomerBookingServiceResponse {
  bookings: CustomerBookingServices[];
  pagination: IMetaPaginationResponse;
}
