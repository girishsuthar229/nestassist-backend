import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { sendError } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";

export const errorHandler = (
  err: { message: string; isJoi: boolean; details: { path: string[]; message: string; }[]; statusCode: number; },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`);

  // Handle Joi validation errors
  if (err.isJoi || err.details) {
    const errors: Record<string, string[]> = {};
    err.details?.forEach((detail: { path: string[]; message: string; }) => {
      const errorKey = detail.path[0].toString();
      if (!errors[errorKey]) {
        errors[errorKey] = [];
      }
      
      const cleanMessage = detail.message.replace(/"/g, "");
      errors[errorKey].push(cleanMessage);
    });

    return sendError(res, MESSAGES.COMMON.VALIDATION_FAILED, STATUS_CODE.BAD_REQUEST, { errors });
  }

  sendError(res, err.message || MESSAGES.COMMON.INTERNAL_SERVER_ERROR, err.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR);
};
