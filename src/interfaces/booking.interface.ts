import { IMetaPaginationResponse } from "@/dtos/apiResponse.dto";
import { Request } from "express";

export interface MyBookingsQuery {
  userId?: number;
  tab?: string;
  page?: string;
  limit?: string;
}

export interface BookingServiceType {
  id: number;
  name: string;
}

export interface BookingServicePartner {
  id: number;
  name: string | null;
  mobileNumber: string | null;
  countryCode?: string | null;
  profileImage?: string | null;
  verificationStatus: string;
  serviceType: BookingServiceType | null;
}

export interface CustomerBooking {
  id: number;
  serviceName: string | null;
  duration: number | null;
  bookingDate: number | null;
  address: string | null;
  amount: number;
  currency: string;
  status: string;
  invoiceNumber: string;
  invoiceDownloadUrl: string;
  servicePartner: BookingServicePartner | null;
}

export interface CustomerBookingResponse {
  bookings: CustomerBooking[];
  pagination: IMetaPaginationResponse;
}
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    sub?: number | string;
    name?: string;
  };
}
