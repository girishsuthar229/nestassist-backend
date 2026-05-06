import Joi from "joi";

export const createCustomerValidation = Joi.object({
  name: Joi.string().max(150).required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.max": "Maximum 150 characters allowed",
  }),
  email: Joi.string().email().max(150).required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.email": "Please enter a valid email address",
  }),
  mobileNumber: Joi.string().min(10).max(10).required().messages({
    "any.required": "Mobile number is required",
    "string.empty": "Mobile number cannot be empty",
    "string.min": "Mobile number must be exactly 10 digits",
    "string.max": "Mobile number must be exactly 10 digits",
  }),
});

export const updateCustomerStatusValidation = Joi.object({
  isActive: Joi.boolean().required().messages({
    "any.required": "isActive status is required",
    "boolean.base": "isActive must be a boolean",
  }),
});
