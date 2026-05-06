import { PaymentGateway, PaymentMethod } from "@/enums/transaction.enum";
import { Booking, Payment } from "@/models";

export interface BookingPaymentInput {
  userId: number;
  serviceId: number;
  addressId: number;
  slot: { date: string; time: string };
  paymentMethod: PaymentMethod;
  paymentGateway: PaymentGateway;
  couponId?: number;
  tax: number;
}

export interface ComputedAmounts {
  amount: number;
  tax: number;
  taxPercentage: number;
  discount: number;
  totalAmount: number;
}

export interface UpdatedBookingPaymentInput
  extends BookingPaymentInput, ComputedAmounts {
  serviceName: string;
  serviceDuration: number;
  serviceAddress: string;
  serviceTypeId?: number;
  userEmail?: string;
  partnerId?: number;
  partnerName?: string;
}

export interface PaymentResult {
  bookingId: number;
  message: string;
  paymentGateway?: PaymentGateway;
  paymentMethod: PaymentMethod;
  amount?: number;
  sessionId?: string;
  orderId?: string;
}

export interface BookingPaymentRecords {
  booking: Booking;
  payment: Payment;
}

export type RazorpayPaymentEntity = {
  order_id: string;
  error_description?: string;
};

export interface InvoiceData {
  invoiceNumber: string;
  bookingId: number;
  customerName: string;
  customerAddress: string;
  serviceName: string;
  servicePartnerName?: string;
  servicePartnerPhone?: string;
  subTotal: number;
  tax: number;
  taxPercentage: string;
  discount: number;
  totalAmount: number;
  currency: string;
  date: Date | string;
  status: string;
  couponCode?: string;
  quantity?: number;
  rate?: number;
  paymentMethod?: string;
  serviceDuration?: number;
  serviceDescription?:string;
}

export interface BookingSuccessDetails {
  bookingId: string;
  bookingStatus: string;
  headerTitle: string;
  serviceName: string;
  serviceDuration: string;
  assignmentStatus: "ASSIGNING_SERVICE_PARTNER" | "SERVICE_PARTNER_ASSIGNED";
  servicePartner?: {
    name: string;
    phone: string;
    image: string | null;
    isVerified: boolean;
    serviceTypeName: string;
  };
  amountPaid: number;
  currency: string;
  invoiceNumber: string;
  invoiceDownloadUrl: string;
  selectedAddress: string;
  selectedDate: string;
  selectedTime: string;
  displayDateTime: string;
}