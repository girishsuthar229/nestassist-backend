import { Router } from "express";
import * as controller from "../controllers/serviceBookingCheckout.controller";
import { checkActiveUser, verifyJWT } from "@/middlewares/auth.middleware";

const router = Router();

/**
 * POST /service/checkout/pay
 * Process service booking payment
 */
router.post("/checkout", verifyJWT, checkActiveUser, controller.processPayment);

router.get(
  "/checkout/:bookingId",
  verifyJWT,
  checkActiveUser,
  controller.getBookingWithPayment,
);
router.put(
  "/checkout/:bookingId",
  verifyJWT,
  checkActiveUser,
  controller.retryBookingPayment,
);

export default router;
