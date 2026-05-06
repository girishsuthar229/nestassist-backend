import { Request, Response, NextFunction } from "express";
import * as couponUsageService from "../services/couponUsage.service";
import logger from "@/utils/logger";
import { sendResponse } from "@/utils/response.util";

/**
 * Check if coupon/offer is used by user
 */
export const checkCouponUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info(`Check coupon usage - Offer ID: ${req.params.offerId}, User ID: ${req.query.userId}`);

    const offerId = Array.isArray(req.params.offerId) ? req.params.offerId[0] : req.params.offerId;
    const userIdQuery = req.query.userId;
    const userId = userIdQuery && typeof userIdQuery === 'string'
      ? (Array.isArray(userIdQuery) ? userIdQuery[0] : userIdQuery)
      : undefined;

    const data = await couponUsageService.checkCouponUsage(offerId, userId);

    return sendResponse(res, undefined, data);
  } catch (err: any) {
    logger.error(err.message);
    next(err);
  }
};