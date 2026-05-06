import { Router } from "express";
import * as adminUserController from "../controllers/adminUser.controller";
import { validate } from "../middlewares/validate.middleware";
import { createValidation, updateValidation } from "../validations/adminUser.validation";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";

const router = Router();

/**
 * Admin User Routes
 * Base path: /api/admin-users
 */

router.get("/", verifyJWT, checkActiveUser, adminUserController.listAdmins);
router.post("/", verifyJWT, checkActiveUser, validate(createValidation), adminUserController.createAdminUser);
router.put("/:id", verifyJWT, checkActiveUser, validate(updateValidation), adminUserController.updateAdminUser);
router.delete("/:id", verifyJWT,  checkActiveUser, adminUserController.deleteAdminUser);

export default router;
