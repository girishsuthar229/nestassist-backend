import { Router } from "express";
import * as profileController from "@/controllers/servicesPartnerProfile.controller";
import { validate } from "@/middlewares/validate.middleware";
import {
  authorizeRoles,
  checkActiveUser,
  verifyJWT,
} from "@/middlewares/auth.middleware";
import { updateProfileValidation } from "@/validations/servicePartner.validation";
import { imageUpload } from "@/middlewares/upload.middleware";
import { UserRole } from "@/enums/userRole.enum";

const router = Router();

/**
 * tags:
 *   name: User Profile
 *   description: Manage logged-in user profile (view & update)
 */

/**
 * /api/user-profile/profile:
 * summary: Get profile
 */
router.get(
  "/profile",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(
    UserRole.CUSTOMER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SERVICE_PARTNER
  ),
  profileController.getMyProfile
);

/**
 * /api/user-profile/update-profile:
 * summary: Update user profile
 * description: Update contact details, password, or profile image.
 */
router.put(
  "/update-profile",
  verifyJWT,
  checkActiveUser,
  authorizeRoles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SERVICE_PARTNER
  ),
  imageUpload.fields([{ name: "profile_image", maxCount: 1 }]),
  validate(updateProfileValidation),
  profileController.updateMyProfile
);

export default router;
