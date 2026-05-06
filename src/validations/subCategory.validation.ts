import Joi from "joi";

export const createValidation = Joi.object({
  name: Joi.string().max(100).required(),
  image: Joi.string().optional().messages({
    "any.required": "image is required",
    "string.base": "image is required",
    "string.empty": "image is required",
  }),
  imageUrl: Joi.string().uri().optional().messages({
    "string.uri": "image must be a valid URL",
  }),
}).or("image", "imageUrl").messages({
  "object.missing": "image is required",
});

export const updateValidation = Joi.object({
  name: Joi.string().max(100).optional(),
  image: Joi.string().optional().messages({
    "string.base": "image is required",
    "string.empty": "image is required",
  }),
  imageUrl: Joi.string().uri().optional(),
});
