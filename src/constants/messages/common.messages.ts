export const COMMON = {
  // Generic success
  SUCCESS: "Success",
  FETCHED: "Fetched successfully",

  // Generic errors
  SOMETHING_WENT_WRONG: "Something went wrong",
  UNAUTHORIZED: "Unauthorized",
  UNAUTHORIZED_ACCESS: "Unauthorized access",
  NOT_FOUND: "Not found",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  SERVER_ERROR: "Server error",
  NAME_DUPLICATE: "Duplicate name",
  CONFIG_ERROR: "Config error",

  // Validation
  INVALID_DATE: "Invalid date",
  INVALID_DATE_FORMAT: "Invalid date format, expected yyyy-MM-dd",
  INVALID_TIME_FORMAT: "Invalid time format, expected HH:mm",
  TIME_ONLY_WITH_DATE: "time is only allowed when date is selected",
  INVALID_SLOT: "Invalid slot",
  INVALID_DURATION: "Invalid duration",
  INVALID_TAX: "Invalid tax",
  INVALID_IDENTIFIERS: "Invalid identifiers",
  FAILED_TO_SEND_OTP: "Failed to send OTP email. Please try again later.",
  INVALID_PAYMENT_METHOD: "Invalid payment method",
  INVALID_PAYMENT_GATEWAY: "Invalid payment gateway",
  VALIDATION_FAILED: "Validation failed.",

  // Role-based
  ADMIN_ONLY: "Only admins can perform this action",

  // Logger
  LOGS_FETCHED: "Logs fetched successfully",

  // File
  ONLY_IMAGES_PDFS_AND_WORD_DOCS_ALLOWED: "Only images, PDFs and Word docs allowed",
  ONLY_IMAGES_JPG_PNG_AND_SVG_ALLOWED: "Only JPG, PNG and SVG images are allowed",
  
} as const;
