import Joi from "joi";
import { MESSAGES } from "@/constants/messages";

export const createValidation = Joi.object({
  coupon_code: Joi.string().trim().max(50).required().messages({
    "any.required": MESSAGES.OFFER_VALIDATION.COUPON_CODE_REQUIRED,
    "string.empty": MESSAGES.OFFER_VALIDATION.COUPON_CODE_EMPTY,
    "string.max": MESSAGES.OFFER_VALIDATION.COUPON_CODE_MAX,
  }),
  coupon_description: Joi.string().allow("", null).max(1000).messages({
    "string.max": MESSAGES.OFFER_VALIDATION.COUPON_DESCRIPTION_MAX,
  }),
  discount_percentage: Joi.number()
    .min(0)
    .max(90)
    .precision(2)
    .required()
    .messages({
      "any.required": MESSAGES.OFFER_VALIDATION.DISCOUNT_PERCENTAGE_REQUIRED,
      "number.base": MESSAGES.OFFER_VALIDATION.DISCOUNT_PERCENTAGE_NUMBER,
      "number.min": MESSAGES.OFFER_VALIDATION.DISCOUNT_PERCENTAGE_MIN,
      "number.max": MESSAGES.OFFER_VALIDATION.DISCOUNT_PERCENTAGE_MAX,
    }),
  max_usage: Joi.number().integer().min(0).default(0).messages({
    "any.required": MESSAGES.OFFER_VALIDATION.MAX_USAGE_REQUIRED,
    "number.base": MESSAGES.OFFER_VALIDATION.MAX_USAGE_NUMBER,
    "number.integer": MESSAGES.OFFER_VALIDATION.MAX_USAGE_INTEGER,
    "number.min": MESSAGES.OFFER_VALIDATION.MAX_USAGE_MIN,
  }),
  used_count: Joi.number().integer().min(0).default(0).messages({
    "number.base": MESSAGES.OFFER_VALIDATION.USED_COUNT_NUMBER,
    "number.integer": MESSAGES.OFFER_VALIDATION.USED_COUNT_INTEGER,
    "number.min": MESSAGES.OFFER_VALIDATION.USED_COUNT_MIN,
  }),
  is_active: Joi.boolean().default(true),
})
  .custom((value, helpers) => {
    if (value.max_usage > 0 && value.used_count > value.max_usage) {
      return helpers.error("any.invalid");
    }

    return value;
  })
  .messages({
    "any.invalid": MESSAGES.OFFER_VALIDATION.USED_COUNT_MAX,
  });

export const updateValidation = Joi.object({
  coupon_code: Joi.string().trim().max(50).messages({
    "string.empty": MESSAGES.OFFER_VALIDATION.COUPON_CODE_EMPTY,
    "string.max": MESSAGES.OFFER_VALIDATION.COUPON_CODE_MAX,
  }),
  coupon_description: Joi.string().allow("", null).max(1000).messages({
    "string.max": MESSAGES.OFFER_VALIDATION.COUPON_DESCRIPTION_MAX,
  }),
  discount_percentage: Joi.number().min(0).max(90).precision(2).messages({
    "number.base": MESSAGES.OFFER_VALIDATION.DISCOUNT_PERCENTAGE_NUMBER,
    "number.min": MESSAGES.OFFER_VALIDATION.DISCOUNT_PERCENTAGE_MIN,
    "number.max": MESSAGES.OFFER_VALIDATION.DISCOUNT_PERCENTAGE_MAX,
  }),
  max_usage: Joi.number().integer().min(0).messages({
    "number.base": MESSAGES.OFFER_VALIDATION.MAX_USAGE_NUMBER,
    "number.integer": MESSAGES.OFFER_VALIDATION.MAX_USAGE_INTEGER,
    "number.min": MESSAGES.OFFER_VALIDATION.MAX_USAGE_MIN,
  }),
  used_count: Joi.number().integer().min(0).messages({  
    "number.base": MESSAGES.OFFER_VALIDATION.USED_COUNT_NUMBER,
    "number.integer": MESSAGES.OFFER_VALIDATION.USED_COUNT_INTEGER,
    "number.min": MESSAGES.OFFER_VALIDATION.USED_COUNT_MIN,
  }),
  is_active: Joi.boolean(),
})
  .min(1)
  .custom((value, helpers) => {
    if (
      value.max_usage !== undefined &&
      value.used_count !== undefined &&
      value.max_usage > 0 &&
      value.used_count > value.max_usage
    ) {
      return helpers.error("any.invalid");
    }

    return value;
  })
  .messages({
    "object.min": "At least one field is required to update the offer",
    "any.invalid": MESSAGES.OFFER_VALIDATION.USED_COUNT_MAX,
  });
