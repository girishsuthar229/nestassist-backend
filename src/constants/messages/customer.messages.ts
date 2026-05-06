export const CUSTOMER = {
  // Success
  CREATED: "Customer created successfully",
  UPDATED: "Customer status updated successfully",
  DELETED: "Customer deleted successfully",
  FETCHED: "Customer fetched successfully",
  PROFILE_FETCHED: "Customer profile fetched successfully.",
  COUPON_APPLIED_SUCCESSFULLY: "Coupon applied successfully!",
  STATUS_UPDATED: (isActive: boolean) => `Customer status updated to ${isActive ? 'Active' : 'Blocked'} successfully`,

  // Errors
  NOT_FOUND: "Customer not found",
  COUPON_APPLIED_FAILED: "Coupon application failed, please try again",
  INVALID_INPUT: "Coupon is not valid or you are not authorized to use this coupon",
  EMAIL_EXISTS: "A user with this email already exists",
  MOBILE_EXISTS: "A user with this mobile number already exists",
  COUPON_NOT_FOUND: "Coupon not found",
  COUPON_INACTIVE: "Coupon is inactive",
  COUPON_MAX_USAGE_REACHED: "Coupon is not applicable for this account",
  COUPON_ALREADY_USED: "You have already used this coupon",
  AUTH_REQUIRED_FOR_COUPON: "User authentication required to apply coupon",
  ALREADY_EMAIL_EXISTS_DEACTIVATED: "A user with this email already exists but the account is deactivated.",
  ALREADY_MOBILE_EXISTS_DEACTIVATED: "A user with this mobile number already exists but the account is deactivated.",
  OTP_NOT_FOUND: "No OTP request found for this email. Please request a new OTP.",
  OTP_EXPIRED: "This OTP has expired. Please request a new OTP.",
  OTP_INCORRECT: "The OTP you entered is incorrect.",
  OTP_SESSION_NOT_FOUND: "No OTP session found for this email. Please start the login process again.",
  OTP_RATE_LIMIT: "Too many attempts. Please try again later.",
} as const;
