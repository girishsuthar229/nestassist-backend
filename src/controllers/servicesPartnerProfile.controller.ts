import { Request, Response, NextFunction } from "express";
import * as profileService from "@/services/servicesPartnerProfile.service";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import logger from "@/utils/logger";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * @name getMyProfile
 * @description
 * Get logged-in service partner profile
 * @access Private
 */

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const result = await profileService.getMyProfile(userId, req.user.role || "");
    return sendResponse(
      res,
      MESSAGES.SERVICE_PARTNER.PROFILE_FETCH_SUCCESS,
      result
    );
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * @name updateMyProfile
 * @description
 * Update logged-in service partner profile details (contact, password, image).
 * @access Private
 */
export const updateMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    const profileImageFile = files?.profile_image?.[0];
    const result = await profileService.updateMyProfile(
      Number(userId),
      userRole,
      req.body,
      profileImageFile
    );

    return sendResponse(
      res,
      MESSAGES.SERVICE_PARTNER.PROFILE_UPDATE_SUCCESS,
      result
    );
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};
