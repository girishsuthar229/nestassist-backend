import Joi from "joi";

export const createValidation = Joi.object({
  name: Joi.string().max(100).required().messages({
    "any.required": "Service type is required",
    "string.empty": "Service type cannot be empty",
    "string.max": "Maximum 100 characters allowed",
  }),
  image: Joi.any().optional(),
  bannerImage: Joi.any().required().messages({
    "any.required": "Banner image is required",
  }),
});

export const updateValidation = Joi.object({
  name: Joi.string().max(100).optional().messages({
    "string.empty": "Service type cannot be empty",
    "string.max": "Maximum 100 characters allowed",
  }),
  image: Joi.any().optional(),
  bannerImage: Joi.any().optional(),
});
