import Joi from "joi";

const stringArrayOrJson = Joi.alternatives().try(
  Joi.array().items(Joi.string()).required(),
  Joi.string().required()
);

export const createValidation = Joi.object({
  name: Joi.string().max(100).required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.max": "Maximum 100 characters allowed",
  }),
  price: Joi.number().precision(2).required().messages({
    "any.required": "Price is required",
    "number.base": "Price must be a number",
  }),
  duration: Joi.number().integer().min(1).required().messages({
    "any.required": "Duration is required",
    "number.base": "Duration must be a number",
    "number.min": "Duration must be at least 1 minute",
  }),
  commission: Joi.number().precision(2).required().messages({
    "any.required": "Commission is required",
    "number.base": "Commission must be a number",
  }),
  availability: Joi.boolean().optional(),
  categoryId: Joi.number().integer().optional(),
  includeServices: stringArrayOrJson.optional(),
  excludeServices: stringArrayOrJson.optional(),
  images: Joi.array().max(10).optional(),
});

export const updateValidation = Joi.object({
  name: Joi.string().max(100).optional().messages({
    "string.empty": "Name cannot be empty",
    "string.max": "Maximum 100 characters allowed",
  }),
  price: Joi.number().precision(2).optional().messages({
    "number.base": "Price must be a number",
  }),
  duration: Joi.number().integer().min(1).optional().messages({
    "number.base": "Duration must be a number",
    "number.min": "Duration must be at least 1 minute",
  }),
  commission: Joi.number().precision(2).optional().messages({
    "number.base": "Commission must be a number",
  }),
  availability: Joi.boolean().optional(),
  subCategoryId: Joi.number().integer().optional(),
  includeServices: stringArrayOrJson.optional(),
  excludeServices: stringArrayOrJson.optional(),
  deletedImages: stringArrayOrJson.optional(),
  images: Joi.array().max(10).optional(),
});

export const availabilityValidation = Joi.object({
  availability: Joi.boolean().required(),
});
