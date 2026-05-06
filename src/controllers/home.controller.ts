import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import * as home from "../services/home.service";
import { getErrorMessage, parseNumber } from "@/utils/common.utils";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";

export const getServiceTypes = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await home.getServiceTypesPublic();
    return sendResponse(res, MESSAGES.SERVICE_TYPE.FETCHED, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

export const getPopularServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseNumber(req.query.limit) ?? 10;
    const data = await home.getPopularServicesPublic({ limit });
    return sendResponse(res, MESSAGES.SERVICE.POPULAR_FETCHED, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

export const getAllServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseNumber(req.query.limit) ?? 12;
    const data = await home.getAllServicesPublic({ limit });
    return sendResponse(res, MESSAGES.SERVICE.ALL_FETCHED, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

export const searchServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const limit = parseNumber(req.query.limit) ?? 12;
    const data = await home.searchServicesPublic({ q, limit });
    return sendResponse(res, MESSAGES.SERVICE.SEARCHED, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

export const getPublicStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await home.getPublicStats();
    return sendResponse(res, MESSAGES.COMMON.FETCHED, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};
