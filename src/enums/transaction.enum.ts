export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
}

export enum PaymentGateway {
  STRIPE = "STRIPE",
  RAZORPAY = "RAZORPAY",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export enum MyBookingTab {
  UPCOMING = "UPCOMING",
  COMPLETED = "COMPLETED",
}
