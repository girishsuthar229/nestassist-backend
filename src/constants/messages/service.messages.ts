export const SERVICE = {
  // Success
  CREATED: "Service created successfully",
  UPDATED: "Service updated successfully",
  DELETED: "Service deleted successfully",
  ALL_FETCHED: "All services fetched successfully",
  SEARCHED: "Services searched successfully",
  POPULAR_FETCHED: "Popular services fetched successfully",
  AVAILABILITY_UPDATED: "Service availability updated successfully",
  SLOTS_FETCHED: "Availability slots fetched successfully.",

  // Errors
  NOT_FOUND: "Service not found",
  ID_REQUIRED: "Service ID is required",
  INVALID_ID: "Invalid service Id",
  NAME_REQUIRED: "Service name is required",
  NOT_ACTIVE: "Service is not active. Please try again later.",
  INVALID_SERVICE_ID: "Invalid serviceId",
  NAME_DUPLICATE_UNDER_SUBCATEGORY: "Service with the same name already exists under this sub-category",
  NO_PARTNER_AVAILABLE: "No service providers available for selected category",
  NO_PARTNER_AVAILABLE_FOR_SLOT: "No service providers available for selected slot",
  ALREADY_PAID: "This slot has already been booked and payment paid by you.",
  SLOT_EXPIRED: "This slot has expired. Please book again later or choose a new slot.",
} as const;

export const SERVICE_TYPE = {
  // Success
  CREATED: "Service Type created successfully",
  UPDATED: "Service Type updated successfully",
  DELETED: "Service Type deleted successfully",
  FETCHED: "Service types fetched successfully",

  // Errors
  NOT_FOUND: "Service type not found",
  CANNOT_DELETE: "Cannot delete Service Type because it has associated categories.",
  ADMIN_ONLY_CREATE: "Only admins can create service types",
  ADMIN_ONLY_UPDATE: "Only admins can update service types",
  ADMIN_ONLY_DELETE: "Only admins can delete service types",
  INVALID_ID: "Invalid serviceTypeId",
} as const;

export const EXPERT = {
  // Success
  FETCHED: "Experts fetched successfully",
  ASSIGNED: "Expert assigned successfully",
  CHANGED: "Expert changed successfully",
  REMOVED: "Expert removed successfully",
  EVENT_TYPES_FETCHED: "Event types fetched successfully",
  DELETED: "Service partner deleted successfully",
  EXPERT_FETCHED: "Experts fetched successfully",
  STATUS_UPDATED: "Service partner status updated successfully",
  APPROVAL_UPDATED: "Service partner approval updated successfully",
  APPROVED: "Service partner has been approved successfully.",
  REJECTED: "Service partner has been rejected successfully.",
  ACTIVATED: "Service partner activated successfully.",
  DEACTIVATED: "Service partner deactivated successfully.",

  // Errors
  NOT_FOUND: "Expert not found",
  ONLY_VERIFIED_CAN_BE_ASSIGNED: "Only verified experts can be assigned",
  NOT_FOUND_PARTNER: "Service partner not found",
  PROFILE_EXISTS: "Service partner profile already exists for this email",
  PARTNER_NOT_FOUND: "Partner not found",
  PARTNER_USER_NOT_FOUND: "Partner user not found",
  INVALID_SERVICE_PARTNER_ID: "Invalid servicePartnerId",
  UNAUTHORIZED: "Unauthorized: Service Partner not found",
} as const;
