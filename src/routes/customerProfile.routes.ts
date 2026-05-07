import { Router } from "express";
import * as profileController from "@/controllers/customerProfile.controller";
import { validate } from "@/middlewares/validate.middleware";
import { sendResponse } from "@/utils/response.util";

import {
  authorizeRoles,
  checkActiveUser,
  verifyJWT,
} from "@/middlewares/auth.middleware";
import {
  changeMobileValidation,
  changeEmailValidation,
  saveAddressValidation,
  verifyEmailUpdateValidation,
} from "@/validations/servicePartner.validation";
import { UserRole } from "@/enums/userRole.enum";

const router = Router();

/**
 * /api/customer/profile/change-mobile:
 * summary: Update customer mobile number
 */
router.patch(
  "/change-mobile",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(UserRole.CUSTOMER),
  validate(changeMobileValidation),
  profileController.changeMobile
);

/**
 * /api/customer/profile/change-email:
 * summary: Initiate customer email update (sends OTP)
 */
router.patch(
  "/change-email",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(UserRole.CUSTOMER),
  validate(changeEmailValidation),
  profileController.changeEmail
);

/**
 * /api/customer/profile/save-address:
 * summary: Create or update customer address
 */
router.patch(
  "/save-address",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(UserRole.CUSTOMER),
  validate(saveAddressValidation),
  profileController.saveAddress
);

/**
 * /api/customer/profile/verify-email-update:
 * summary: Verify OTP and update customer email
 */
router.post(
  "/verify-email-update",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(UserRole.CUSTOMER),
  validate(verifyEmailUpdateValidation),
  profileController.verifyEmailUpdate
);

/**
 * /api/customer/profile/addresses:
 * summary: Get customer addresses
 */
router.get(
  "/addresses",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(UserRole.CUSTOMER),
  profileController.getUserAddresses
);

/**
 * /api/customer/profile/addresses/:id:
 * summary: Get single customer address
 */
router.get(
  "/addresses/:id",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(UserRole.CUSTOMER),
  profileController.getAddressById
);

/**
 * /api/customer/profile/addresses/:id:
 * summary: Delete customer address
 */
router.delete(
  "/addresses/:id",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(UserRole.CUSTOMER),
  profileController.deleteAddress
);


/**
 * /api/customer/profile/recent-searches:
 * summary: Get recent searches
 */
router.get(
  "/recent-searches",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(UserRole.CUSTOMER),
  profileController.getRecentSearches
);

/**
 * /api/customer/profile/recent-searches:
 * summary: Save recent search
 */
router.post(
  "/recent-searches",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(UserRole.CUSTOMER),
  profileController.saveRecentSearch
);


export default router;


