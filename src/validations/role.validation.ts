import Joi from "joi";

export const createRoleSchema = Joi.object({
  name: Joi.string().max(50).required().messages({
    "any.required": "Role name is required",
    "string.empty": "Role name cannot be empty",
  }),
  description: Joi.string().max(255).allow(null, ""),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().max(50).messages({
    "string.empty": "Role name cannot be empty",
  }),
  description: Joi.string().max(255).allow(null, ""),
});
