// src/controllers/log.controller.ts

import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "@/utils/asyncErrorHandler";
import { sendResponse } from "@/utils/response.util";
import {
  getLogsService,
  getEventTypesOfLogService,
} from "@/services/logger.service";
import { LogCategory } from "@/enums/log.enum";
import { LoggerRequestQuery } from "@/dtos/logger.dto";
import { MESSAGES } from "@/constants/messages";

export const getLogs = asyncErrorHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const logs = await getLogsService(req.query as LoggerRequestQuery);

    return sendResponse(res, {
      data: logs.data,
      pagination: logs.pagination,
      message: MESSAGES.COMMON.LOGS_FETCHED,
    });
  }
);

export const getEventTypesOfLog = asyncErrorHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { category } = req.query;

    const eventTypes = await getEventTypesOfLogService(category as LogCategory);

    return sendResponse(res, MESSAGES.EXPERT.EVENT_TYPES_FETCHED, eventTypes);
  }
);
