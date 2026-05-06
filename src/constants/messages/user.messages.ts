export const USER = {
  // Success
  CREATED: "Admin user created successfully",
  UPDATED: "Admin user updated successfully",
  DELETED: "Admin user deleted successfully",

  // Errors
  NOT_FOUND: "User not found",
  ADMIN_NOT_FOUND: "Admin not found",
  ALREADY_EXISTS: "Admin with this email already exists",
  ADMIN_ROLE_NOT_CONFIGURED: "Admin role not configured properly",
  USER_EMAIL_EXISTS: "A user with this email already exists",
  USER_MOBILE_EXISTS: "A user with this mobile number already exists"
} as const;
