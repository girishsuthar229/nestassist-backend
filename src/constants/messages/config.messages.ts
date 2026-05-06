export const CONFIGURATION = {
  // Success
  UPDATED: "Configuration value updated successfully",

  // Errors
  NOT_FOUND: "Configuration not found",
  INVALID_NUMBER: "Invalid number value",
  INVALID_BOOLEAN: "Invalid boolean value",
  BOOLEAN_MUST_BE_TRUE_OR_FALSE: "Boolean value must be 'true' or 'false'",
  INVALID_JSON: "Invalid JSON value",
  INVALID_JSON_STRING: "Invalid JSON string",
  INVALID_DATE: "Invalid date value",
  INVALID_STRING: "Invalid string value",
  UNKNOWN_VALUE_TYPE: "Unknown value type",
} as const;

export const DASHBOARD = {
  FETCHED: "Dashboard fetched successfully",
} as const;

export const CONTACT = {
  CREATED: "Contact created successfully",
  INVALID_DATE: "Invalid date format provided for filtering",
} as const;
