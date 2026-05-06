import { Router } from "express";
import * as contactController from "../controllers/contact.controller";
import { validate } from "../middlewares/validate.middleware";
import { createValidation } from "../validations/contact.validation";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";

const router = Router();

router.get(
  "/",
  verifyJWT,
  checkActiveUser,
  contactController.getContacts
);
router.post(
  "/",
  validate(createValidation),
  contactController.createContact
);

export default router;
