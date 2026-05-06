export const PAYMENT = {
  // Success
  PROCESSED: "Payment processed successfully",
  RETRIED: "Payment retried successfully",
  ALREADY_COMPLETED: "Payment already completed",
  REUSING_EXISTING_STRIPE_SESSION: "Reusing existing Stripe session",
  REUSING_EXISTING_RAZORPAY_SESSION: "Reusing existing Razorpay session",
  REDIRECTING_TO_STRIPE_CHECKOUT: "Redirecting to Stripe checkout",

  // Errors
  NOT_FOUND: "Payment not found",
  NOT_LINKED: "Payment not linked with booking",
  INVALID_GATEWAY: "Invalid payment gateway",
  INVALID_METHOD: "Invalid payment method",
  INVALID_SIGNATURE: "Invalid signature",
  STRIPE_ERROR: "Stripe error",
  RAZORPAY_ERROR: "Razorpay error",
  PAYMENT_METHOD_NOT_SUPPORTED: "Payment method not supported",
  CANCELLED_FROM_PAYMENT_GATEWAY: "Cancelled from payment gateway",
  PAYMENT_FAILED: "Payment failed",
  STRIPE_API_KEYS_NOT_SET: "Stripe API keys not set",
} as const;

export const TRANSACTION = {
  // Success
  DELETED: "Transaction deleted successfully",

  // Errors
  NOT_FOUND: "Transaction not found",
  INVOICE_NOT_FOUND: "Invoice not found",
} as const;
