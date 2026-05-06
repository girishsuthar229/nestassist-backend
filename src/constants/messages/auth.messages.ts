export const AUTH = {
  // Success
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  LOGOUT_SUCCESS_ALT: "Successfully logged out.",
  REGISTER_SUCCESS: "Service Partner registered successfully",
  PASSWORD_RESET_TOKEN_SENT: "Password reset link has been sent to your email address. The link will expire in 10 minutes.",
  PASSWORD_RESET_SUCCESS: "Password reset successfully. You can now login with your new password.",

  // OTP
  OTP_SENT: "OTP has been sent to your email address. It will expire in 10 minutes.",
  OTP_RESENT: "A new OTP has been sent to your email address.",
  OTP_VERIFIED: "OTP verified successfully. You are now logged in.",
  OTP_INCORRECT: "The OTP you entered is incorrect.",

  // Errors
  INVALID_CREDENTIALS: "Invalid email or password",
  INVALID_RESET_TOKEN: "Invalid reset token.",
  INVALID_RESET_TOKEN_TYPE: "Invalid reset token type.",
  PASSWORD_RESET_EXPIRED: "Password reset link has expired.",
  ACCESS_DENIED_NOT_PARTNER: "Access denied. Not a service partner profile.",
  ACCOUNT_INACTIVE: "Your account has been deactivated. Please contact support.",
  ACCOUNT_NOT_ACTIVATED: "Your account is not activated or verified. Please contact support.",
  PASSWORD_NOT_SET: "Password not set for this account. Please use 'Forgot Password' to set one.",
  PASSWORD_RESET_ONLY_FOR_PARTNERS: "Access denied. Password reset only allowed for service partners from here.",
  PASSWORD_RESET_LINK_EXPIRED: "This password reset link has already been used or is invalid.",
  UNAUTHORIZED: "Unauthorized: No token provided",
  FORBIDDEN: "Forbidden: Invalid or expired token",
  JWT_SECRET_MISSING: "Internal server error: JWT secret missing",
  INVALID_OR_EXPIRED_TOKEN: "Unauthorized: Invalid or expired token",
  INVALID_TOKEN_MISSING_USER_ID: "Invalid token: missing user ID",
  ACCOUNT_INACTIVE_CONTACT_SUPPORT: "Your account is inactive. Contact support.",
  INVALID_TOKEN_PAYLOAD: "Forbidden: Invalid token payload structure",
  TOKEN_VERIFICATION_FAILED: "Token verification failed",
  TOKEN_MISSING_BEARER_FORMAT: "Missing or invalid token format",
  MALFORMED_AUTHORIZATION_HEADER: "Malformed Authorization header",
  FORBIDDEN_ROLE: "Access denied: You do not have the required permissions.",
} as const;
