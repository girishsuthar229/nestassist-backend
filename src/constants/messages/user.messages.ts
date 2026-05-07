export const USER = {
  // Success
  CREATED: "Admin user created successfully",
  UPDATED: "Admin user updated successfully",
  DELETED: "Admin user deleted successfully",
  MOBILE_UPDATE:"Mobile number updated successfully",
  EMAIL_UPDATE:"Email updated successfully",
  ADDRESS_FETCHED: "Addresses fetched successfully",
  ADDRESS_CREATED: "Address created successfully",
  ADDRESS_UPDATED: "Address updated successfully",
  ADDRESS_DELETED: "Address deleted successfully",
  RECENT_SEARCH_FETCHED: "Recent searches fetched successfully",
  RECENT_SEARCH_SAVED: "Search saved successfully",
  
  // Errors
  NOT_FOUND: "User not found",
  ADMIN_NOT_FOUND: "Admin not found",
  ALREADY_EXISTS: "Admin with this email already exists",
  ADMIN_ROLE_NOT_CONFIGURED: "Admin role not configured properly",
  USER_EMAIL_EXISTS: "A user with this email already exists",
  USER_MOBILE_EXISTS: "A user with this mobile number already exists",
  SAME_EMAIL_ADDRESS: "You are sending the same email address.",
  ADDRESS_NOT_FOUND: "Address not found or unauthorized",
} as const;
