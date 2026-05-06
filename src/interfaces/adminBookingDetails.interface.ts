import {
  Booking,
  Payment,
  Service,
  ServicePartner,
  ServiceType,
  User,
} from "@/models";

export type AdminBookingDetails = {
  bookingId: string;
  status?: string;
  serviceId?: string;
  serviceName?: string;
  serviceType?: string;
  scheduledAt?: string;
  createdAt?: string;
  cancellationReason?: string;
  customer?: {
    id?: string | number;
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  servicePartner?: {
    id?: string | number;
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  payment?: {
    paymentStatus?: string;
    paymentMethod?: string;
    paymentGateway?: string;
    transactionId?: string;
    paidAt?: string;
  };
  charges?: {
    servicePartnerCharges?: number;
    commissionAmount?: number;
    commissionPercent?: number;
    partnerPayout?: number;
    currency?: string;
  };
  customerPayment?: {
    subtotal?: number;
    tax?: number;
    discount?: number;
    total?: number;
    paid?: number;
    currency?: string;
  };
};

export type BookingDetailsWithRelations = Booking & {
  service?: Service;
  serviceType?: ServiceType;
  customer?: User;
  servicePartner?: ServicePartner & {
    user?: User;
  };
  payment?: Payment;
};
