import { Request, Response, NextFunction } from "express";
import logger from "@/utils/logger";
import {
  getDashboardOverviewOptimized,
  getServicePartnerDashboardOptimized,
} from "@/services/dashboard.service";
import * as servicePartnerRepository from "../repositories/servicePartner.repository";
import { sendResponse, sendError } from "@/utils/response.util";
import { getErrorMessage } from "@/utils/common.utils";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";

export const getDashboardOverview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    logger.info(`Fetching dashboard overview data from DB.`);

    const data = await getDashboardOverviewOptimized();
    return sendResponse(res, undefined, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * Service Partner Dashboard Controller
 */
export const getServicePartnerDashboardController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return sendError(
        res,
        MESSAGES.EXPERT.UNAUTHORIZED,
        STATUS_CODE.UNAUTHORIZED,
      );
    }

    const servicePartnerId =
      await servicePartnerRepository.findServicePartnerByUserId(userId);

    if (!servicePartnerId) {
      return sendError(
        res,
        MESSAGES.EXPERT.UNAUTHORIZED,
        STATUS_CODE.UNAUTHORIZED,
      );
    }

    const data = await getServicePartnerDashboardOptimized(
      +servicePartnerId.id,
    );
    return sendResponse(res, MESSAGES.DASHBOARD.FETCHED, data);
  } catch (error) {
    logger.error("Dashboard Error:", error);
    return sendError(res, MESSAGES.COMMON.SOMETHING_WENT_WRONG);
  }
};
