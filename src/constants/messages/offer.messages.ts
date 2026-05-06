export const OFFER = {
  FETCHED: "Offer fetched successfully",
  CREATED: "Offer created successfully",
  UPDATED: "Offer updated successfully",
  USED_COUNT_UPDATED: "Offer used count updated successfully",
  DELETED: "Offer deleted successfully",
  NO_LONGER_AVAILABLE: "Coupon is no longer available",

  //error
  NOT_FOUND: "No offers found",
  NOT_FOUND_OFFER: "Offer not found",
  COUPON_CODE_EXISTS: "Coupon code already exists",
  REQUIRED_OFFER_ID: "Offer ID is required",
  USED_COUNT_EXCEEDS_MAX_USAGE: "Coupon has exceeded its maximum usage limit",
} as const;

export const OFFER_VALIDATION = {
  COUPON_CODE_REQUIRED: "Coupon code is required",
  COUPON_CODE_EMPTY: "Coupon code cannot be empty",
  COUPON_CODE_MAX: "Maximum 50 characters allowed for coupon code",
  COUPON_DESCRIPTION_MAX:
    "Maximum 1000 characters allowed for coupon description",
  DISCOUNT_PERCENTAGE_REQUIRED: "Discount percentage is required",
  DISCOUNT_PERCENTAGE_NUMBER: "Discount percentage must be a number",
  DISCOUNT_PERCENTAGE_MIN: "Discount percentage cannot be negative",
  DISCOUNT_PERCENTAGE_MAX: "Discount percentage cannot be greater than 90",
  MAX_USAGE_REQUIRED: "Max usage is required",
  MAX_USAGE_NUMBER: "Max usage must be a number",
  MAX_USAGE_INTEGER: "Max usage must be an integer",
  MAX_USAGE_MIN: "Max usage cannot be negative",
  USED_COUNT_REQUIRED: "Used count is required",
  USED_COUNT_NUMBER: "Used count must be a number",
  USED_COUNT_INTEGER: "Used count must be an integer",
  USED_COUNT_MIN: "Used count cannot be negative",
  USED_COUNT_MAX: "Coupon has exceeded its maximum usage limit",
} as const;
