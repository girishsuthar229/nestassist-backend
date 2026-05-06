import { NextFunction, Request, Response } from "express";
import * as AdminCustomerService from "../services/adminCustomerBookings.service";
import logger from "../utils/logger";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { AdminCustomerDetailFilterQuery } from "@/interfaces/adminCustomer.interface";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * @name getCustomerDetailById
 * @description Get Customer Details By ID.
 * @access Private
 */
export const getCustomerDetailById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    logger.info(
      `AdminCustomerBookingsController: Get Customer detail request for id ${id}`
    );
    const result = await AdminCustomerService.getCustomerDetailById(Number(id));
    return sendResponse(res, MESSAGES.CUSTOMER.FETCHED, result);
  } catch (error: unknown) {
    logger.error(
      `AdminCustomerBookingsController:getCustomerDetailById Error ${getErrorMessage(
        error
      )}`
    );
    next(error);
  }
};

/**
 * @name getCustomerBookingServices
 * @description List Custmore users with pagination, filtering and sorting.
 * @access Private
 */
export const getCustomerBookingServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const query = req.query as AdminCustomerDetailFilterQuery;
  try {
    const result = await AdminCustomerService.getCustomerBookingServices(
      Number(id),
      query
    );

    return sendResponse(
      res,
      MESSAGES.BOOKING.CUSTOMER_BOOKING_SERVICES_FETCHED,
      result
    );
  } catch (error: unknown) {
    logger.error(
      `AdminCustomerBookingsController:getCustomerBookingServices error: ${getErrorMessage(
        error
      )}`
    );
    next(error);
  }
};
