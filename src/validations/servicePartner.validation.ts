import Joi from "joi";
import { ApprovalAction, Gender, ProfileUpdateType, CustomerProfileUpdateType } from "../enums/servicePartner.enum";
import { UserRole } from "@/enums/userRole.enum";


export const registerPartnerValidation = Joi.object({
  profileImage: Joi.any().optional(),
  fullName: Joi.string().min(2).required().messages({
    "any.required": "Full Name is required",
    "string.empty": "Full Name cannot be empty",
    "string.min": "Full Name must be at least 2 characters",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.email": "Please enter a valid email address",
  }),
  dob: Joi.string()
    .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    .required()
    .messages({
      "any.required": "Date of birth is required",
      "string.empty": "Date of birth cannot be empty",
      "string.pattern.base": "Date of birth must be in DD/MM/YYYY format",
    }),
  gender: Joi.string()
    .valid(...Object.values(Gender))
    .required()
    .messages({
      "any.required": "Please select gender",
      "any.only": `Gender must be one of: ${Object.values(Gender).join(", ")}`,
    }),
  mobile: Joi.string().min(10).max(10).required().messages({
    "any.required": "Mobile number is required",
    "string.empty": "Mobile number cannot be empty",
    "string.min": "Mobile number must be of 10 digits",
    "string.max": "Mobile number must be of 10 digits",
  }),
  applyingFor: Joi.array()
    .items(Joi.number().integer())
    .min(1)
    .required()
    .messages({
      "any.required": "Please select at least one service type",
      "array.base": "Please select at least one service type",
      "array.min": "Please select at least one service type",
    }),
  permanentAddress: Joi.string().allow("", null),
  residentialAddress: Joi.string().allow("", null),

  // Arrays
  education: Joi.array()
    .items(
      Joi.object({
        school: Joi.string().required().messages({
          "any.required": "School/College name is required",
          "string.empty": "School/College name is required",
        }),
        year: Joi.number()
          .integer()
          .min(1900)
          .max(new Date().getFullYear())
          .required()
          .messages({
            "any.required": "Passing year is required",
          }),
        marks: Joi.number().min(0).max(100).required().messages({
          "any.required": "Marks are required",
          "number.base": "Marks must be a number",
          "number.min": "Marks cannot be less than 0",
          "number.max": "Marks cannot exceed 100",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "any.required": "At least one educational info is required",
      "array.min": "At least one educational info is required",
    }),

  professional: Joi.array()
    .items(
      Joi.object({
        company: Joi.string().allow("", null),
        role: Joi.string().allow("", null),
        from: Joi.string().allow("", null),
        to: Joi.string().allow("", null),
      })
    )
    .optional(),

  skills: Joi.array().items(Joi.number().integer()).min(1).required().messages({
    "any.required": "At least one skill is required",
  }),

  servicesOffered: Joi.array()
    .items(Joi.number().integer())
    .min(1)
    .required()
    .messages({
      "any.required": "Please select at least one service",
    }),

  languages: Joi.array()
    .items(
      Joi.object({
        language: Joi.string().required().messages({
          "any.required": "Language is required",
          "string.empty": "Language is required",
        }),
        proficiency: Joi.string()
          .valid(
            "beginner",
            "intermediate",
            "expert",
            "Beginner",
            "Intermediate",
            "Expert"
          )
          .required()
          .messages({
            "any.required": "Proficiency level is required",
            "string.empty": "Proficiency level is required",
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      "any.required": "At least one language is required",
      "array.min": "At least one language is required",
    }),

  attachments: Joi.array().min(1).required().messages({
    "any.required": "At least one document is required",
    "array.min": "At least one document is required",
  }),
});

export const approveRejectPartnerValidation = Joi.object({
  action: Joi.string()
    .valid(...Object.values(ApprovalAction))
    .required()
    .messages({
      "any.required": "Action is required",
      "any.only": `Invalid action. Must be one of: ${Object.values(ApprovalAction).join(", ")}`,
    }),
});

export const updateProfileValidation = Joi.object({
  role: Joi.string()
   .valid(
     UserRole.ADMIN,
     UserRole.SUPER_ADMIN,
     UserRole.SERVICE_PARTNER
   )
   .required(),
  type: Joi.string()
    .valid(
      ProfileUpdateType.CONTACT,
      ProfileUpdateType.PASSWORD,
      ProfileUpdateType.IMAGE,
      ProfileUpdateType.SERVICES
    )
    .required()
    .messages({
      "any.required": "Update type is required",
      "any.only": `Update type must be one of: ${Object.values(
        ProfileUpdateType
      ).join(", ")}`,
      "string.empty": "Update type cannot be empty",
    }),

  mobile: Joi.string()
    .min(10)
    .max(10)
    .when("type", {
      is: ProfileUpdateType.CONTACT,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "Mobile number is required",
      "string.empty": "Mobile number cannot be empty",
      "string.min": "Mobile number must be exactly 10 digits",
      "string.max": "Mobile number must be exactly 10 digits",
    }),

  email: Joi.string()
    .email()
    .when("type", {
      is: ProfileUpdateType.CONTACT,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
      "string.email": "Please enter a valid email address",
    }),

  permanent_address: Joi.string()
   .trim()
   .min(3)
   .when("type", {
     is: ProfileUpdateType.CONTACT,
     then: Joi.when("role", {
       is: UserRole.SERVICE_PARTNER,
       then: Joi.required(),
       otherwise: Joi.forbidden(),
     }),
     otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "Permanent Address is required",
      "string.empty": "Permanent Address cannot be empty",
      "string.min": "Permanent Address is too short",
    }),

  residential_address: Joi.string()
    .trim()
    .min(3)
    .when("type", {
      is: ProfileUpdateType.CONTACT,
      then: Joi.when("role", {
        is: UserRole.SERVICE_PARTNER,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "Residential Address is required",
      "string.empty": "Residential Address cannot be empty",
      "string.min": "Residential Address is too short",
    }),

  profile_address: Joi.string()
  .trim()
  .min(3)
  .when("type", {
    is: ProfileUpdateType.CONTACT,
    then: Joi.when("role", {
      is: Joi.valid(UserRole.ADMIN, UserRole.SUPER_ADMIN),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    otherwise: Joi.forbidden(),
  })
  .messages({
    "any.required": "Profile Address is required",
    "string.empty": "Profile Address cannot be empty",
    "string.min": "Profile Address is too short",
  }),

  current_password: Joi.string()
    .when("type", {
      is: ProfileUpdateType.PASSWORD,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "Current password is required",
      "string.empty": "Current password cannot be empty",
    }),
  password: Joi.string()
    .min(8)
    .when("type", {
      is: ProfileUpdateType.PASSWORD,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least 8 characters",
    }),
  password_confirmation: Joi.any()
    .valid(Joi.ref("password"))
    .when("type", {
      is: ProfileUpdateType.PASSWORD,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "Password confirmation is required",
      "string.empty": "Password confirmation cannot be empty",
      "any.only": "Password confirmation does not match",
    }),

  profile_image: Joi.any()
    .when("type", {
      is: ProfileUpdateType.IMAGE,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "Profile image is required",
    }),
    servicetypes: Joi.array()
    .items(Joi.string())
    .min(1)
    .when("type", {
      is: ProfileUpdateType.SERVICES,
      then: Joi.when("role", {
        is: UserRole.SERVICE_PARTNER,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "At least one service type is required",
      "array.base": "Service type must be an array",
      "array.min": "Select at least one service type",
      "any.unknown": "Service type is not allowed for this update type",
    }),
  
  categories: Joi.array()
    .items(Joi.string())
    .min(1)
    .when("type", {
      is: ProfileUpdateType.SERVICES,
      then: Joi.when("role", {
        is: UserRole.SERVICE_PARTNER,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "At least one category is required",
      "array.base": "Categories must be an array",
      "array.min": "Select at least one category",
      "any.unknown": "Categories are not allowed for this update type",
    }),
  
  subcategories: Joi.array()
    .items(Joi.string())
    .min(1)
    .when("type", {
      is: ProfileUpdateType.SERVICES,
      then: Joi.when("role", {
        is: UserRole.SERVICE_PARTNER,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "any.required": "At least one subcategory is required",
      "array.base": "Subcategories must be an array",
      "array.min": "Select at least one subcategory",
      "any.unknown": "Subcategories are not allowed for this update type",
    }),
});

export const changeMobileValidation = Joi.object({
  mobile_number: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "any.required": "Mobile number is required",
      "string.empty": "Mobile number is required",
      "string.pattern.base": "Mobile number must be exactly 10 digits",
    }),
});

export const changeEmailValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
      "string.email": "Please enter a valid email address",
    }),
});

export const saveAddressValidation = Joi.object({
  id: Joi.number().integer().allow(null).optional(),
  label: Joi.string().required().messages({
    "any.required": "Label is required",
  }),
  house_flat_number: Joi.string().required().messages({
    "any.required": "House/Flat number is required",
  }),
  landmark: Joi.string().allow("", null).optional(),
  address: Joi.string().required().messages({
    "any.required": "Address is required",
  }),
  latitude: Joi.alternatives()
    .try(Joi.number(), Joi.string())
    .allow(null)
    .optional(),
  longitude: Joi.alternatives()
    .try(Joi.number(), Joi.string())
    .allow(null)
    .optional(),
  custom_label: Joi.string().allow("", null).optional(),
  city: Joi.string().allow("", null).optional(),
  state: Joi.string().allow("", null).optional(),
  country: Joi.string().allow("", null).optional(),
  postcode: Joi.string().allow("", null).optional(),
});

export const verifyEmailUpdateValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "any.required": "Email is required",
      "string.email": "Please enter a valid email address",
    }),
  otp: Joi.string()
    .min(4)
    .max(4)
    .required()
    .messages({
      "any.required": "OTP is required",
      "string.min": "OTP must be 4 digits",
      "string.max": "OTP must be 4 digits",
    }),
});