import { Request, Response, NextFunction } from "express";
import * as configurationService from "@/services/configuration.service";
import logger from "@/utils/logger";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";

/**
 * Get all Configurations
 */
export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info("Get all Configurations request");
    const data = await configurationService.getConfigurations();

    return sendResponse(res, undefined, data);
  } catch (err: any) {
    logger.error(err.message);
    next(err);
  }
};

/**
 * Get Configuration by configKey
 */
export const getByKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info(`Get Configuration by key: ${req.params.key}`);
    const data = await configurationService.getConfigurationByKey(req.params.key as string);

    return sendResponse(res, undefined, data);
  } catch (err: any) {
    logger.error(err.message);
    next(err);
  }
};

/**
 * Update Configuration value only
 */
export const updateValue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info(`Update Configuration value for ID: ${req.params.id}`);
    const data = await configurationService.updateConfigurationValue(
      req.params.id as string,
      req.body.value
    );

    return sendResponse(res, MESSAGES.CONFIGURATION.UPDATED, data);
  } catch (err: any) {
    logger.error(err.message);
    next(err);
  }
};
