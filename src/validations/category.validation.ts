import Joi from "joi";

export const createValidation = Joi.object({
  name: Joi.string().max(100).required(),
  image: Joi.string().optional().messages({
    "string.base": "image is required",
  }), // image is the field name in multipart request
  imageUrl: Joi.string().uri().optional(),
}).or("image", "imageUrl").messages({
  "object.missing": "image is required",
});

export const updateValidation = Joi.object({
  name: Joi.string().max(100).optional(),
  image: Joi.string().optional().messages({
    "string.base": "image is required",
  }),
  imageUrl: Joi.string().uri().optional(),
});

export const bulkCreateValidation = Joi.object({
  categories: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().optional(),
      name: Joi.string().max(100).required(),
      imageUrl: Joi.string().uri().optional(),
      image: Joi.string().optional().messages({
        "string.base": "image is required",
      }),
      subCategories: Joi.array().items(
        Joi.object({
          id: Joi.number().integer().optional(),
          name: Joi.string().max(100).required(),
          imageUrl: Joi.string().uri().optional(),
          image: Joi.string().optional().messages({
            "string.base": "image is required",
          }),
        }).or("imageUrl", "image").messages({
          "object.missing": "image is required",
        })
      ).allow(null).optional()
    }).or("imageUrl", "image").messages({
      "object.missing": "image is required",
    })
  ).min(1).required()
}).unknown(true);