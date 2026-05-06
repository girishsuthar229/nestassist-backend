import CouponUsage from "@/models/couponUsage.model";
import { ApiError } from "@/utils/apiError.util";
import logger from "@/utils/logger";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { findOfferById } from "@/repositories/serviceBookingCheckout.repository";
import { updateOfferUsedCountService } from "./offer.service";

/**
 * Check if coupon/offer is used by user
 */
export const checkCouponUsage = async (offerId: string, userId?: string) => {
  logger.info(
    `CouponUsageService: Checking usage for offer ${offerId}, user ${userId}`,
  );

  if (!userId) {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      MESSAGES.CUSTOMER.AUTH_REQUIRED_FOR_COUPON,
    );
  }

  const offer = await findOfferById(parseInt(offerId, 10));

  if (!offer) {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      MESSAGES.CUSTOMER.COUPON_NOT_FOUND,
    );
  }
  if (!offer.isActive) {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      MESSAGES.CUSTOMER.COUPON_INACTIVE,
    );
  }
  if (offer.usedCount >= offer.maxUsage) {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      MESSAGES.CUSTOMER.COUPON_MAX_USAGE_REACHED,
    );
  }

  const usage = await CouponUsage.findOne({
    where: {
      offerId: parseInt(offerId, 10),
      userId: parseInt(userId, 10),
    },
  });

  if (usage) {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      MESSAGES.CUSTOMER.COUPON_ALREADY_USED,
    );
  }

  return {
    success: true,
    message: MESSAGES.CUSTOMER.COUPON_APPLIED_SUCCESSFULLY,
  };
};
export const createCouponUsage = async (offerId: string, userId?: string) => {
  logger.info(
    `CouponUsageService: Creating usage for offer ${offerId}, user ${userId}`,
  );

  if (!userId) {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      MESSAGES.CUSTOMER.AUTH_REQUIRED_FOR_COUPON,
    );
  }

  const numericOfferId = Number(offerId);
  const numericUserId = Number(userId);

  // Validate numeric conversion
  if (!Number.isFinite(numericOfferId) || !Number.isFinite(numericUserId)) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.CUSTOMER.INVALID_INPUT,
    );
  }

  await checkCouponUsage(offerId, userId);

  const usage = await CouponUsage.create({
    offerId: numericOfferId,
    userId: numericUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Increment offer used count outside the transaction to reduce lock time
  if (!usage) {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      MESSAGES.CUSTOMER.COUPON_APPLIED_FAILED,
    );
  }
  await updateOfferUsedCountService(numericOfferId);

  return {
    success: true,
    message: MESSAGES.CUSTOMER.COUPON_APPLIED_SUCCESSFULLY,
  };
};
