import { Router } from "express";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import * as controller from "../controllers/offer.controller";
import {
  createValidation,
  updateValidation,
} from "@/validations/offer.validation";

const router = Router();

router.post("/", validate(createValidation), controller.createOffer);
router.put(
  "/:offerId",
  validate(updateValidation),
  controller.updateOffer,
);
router.patch(
  "/:offerId/used-count",
  controller.updateOfferUsedCount,
);
router.delete("/:offerId", controller.deleteOffer);
router.get("/:offerId", controller.getOffer);
router.get("/", controller.getOffers);

export default router;
