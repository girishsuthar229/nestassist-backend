import Joi from "joi";

export const createValidation = Joi.object({
  name: Joi.string().max(100).required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.max": "Maximum 100 characters allowed",
  }),
  email: Joi.string().email().max(150).required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.email": "Please enter a valid email address",
  }),
  mobile: Joi.string().min(10).max(10).required().messages({
    "any.required": "Mobile number is required",
    "string.empty": "Mobile number cannot be empty",
    "string.min": "Mobile number must be exactly 10 digits",
    "string.max": "Mobile number must be exactly 10 digits",
  }),
  password: Joi.string().min(8).required().messages({
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 8 characters",
  }),
  confirmPassword: Joi.any()
    .equal(Joi.ref("password"))
    .required()
    .messages({
      "any.required": "Confirm password is required",
      "any.only": "Passwords do not match",
    }),
  isActive: Joi.boolean().default(true),
});

export const updateValidation = Joi.object({
  name: Joi.string().max(100).messages({
    "string.empty": "Name cannot be empty",
    "string.max": "Maximum 100 characters allowed",
  }),
  email: Joi.string().email().max(150).messages({
    "string.empty": "Email cannot be empty",
    "string.email": "Please enter a valid email address",
  }),
  mobile: Joi.string().min(10).max(10).messages({
    "string.empty": "Mobile number cannot be empty",
    "string.min": "Mobile number must be exactly 10 digits",
    "string.max": "Mobile number must be exactly 10 digits",
  }),
  isActive: Joi.boolean(),
  password: Joi.any().forbidden().messages({
    "any.unknown": "Password is not allowed",
  }),
  confirmPassword: Joi.any().forbidden().messages({
    "any.unknown": "Confirm password is not allowed",
  }),
});
