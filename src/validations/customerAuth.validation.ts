import Joi from "joi";

export const sendOtpValidation = Joi.object({
  name: Joi.string().min(2).max(150).required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 150 characters",
  }),
  email: Joi.string().email().max(255).required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.email": "Please provide a valid email address",
    "string.max": "Email cannot exceed 255 characters",
  }),
});

export const verifyOtpValidation = Joi.object({
  email: Joi.string().email().max(255).required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.email": "Please provide a valid email address",
  }),
  otp: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "any.required": "OTP is required",
      "string.empty": "OTP cannot be empty",
      "string.pattern.base": "OTP must be exactly 4 digits",
    }),
});

export const resendOtpValidation = Joi.object({
  email: Joi.string().email().max(255).required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.email": "Please provide a valid email address",
  }),
});
