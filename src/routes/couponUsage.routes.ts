import { Router } from "express";
import * as couponUsageController from "@/controllers/couponUsage.controller";

const router = Router();

/**
 * Coupon Usage Routes
 * Base path: /api/coupon-usages
 */

// Check if coupon is used by user
// GET /api/coupon-usages/check/:offerId?userId=123
router.get("/check/:offerId", couponUsageController.checkCouponUsage);

export default router;
