import { Request, Response, NextFunction } from "express";
import * as AdminCustomerService from "../services/adminCustomer.service";
import logger from "../utils/logger";
import { AdminCustomerFilterQuery } from "@/interfaces/adminCustomer.interface";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * GET /api/admin-customers
 */
export const listCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, search, status, minBookings, maxBookings } = req.query as AdminCustomerFilterQuery;
    const sortBy = (req.query.sortBy || req.query.sort_by) as string;
    const sortOrder = (req.query.sortOrder || req.query.sort_order) as string;

    const data = await AdminCustomerService.listCustomers({
      page: page,
      limit: limit,
      sortBy: sortBy,
      sortOrder: (sortOrder as "ASC" | "DESC") || "DESC",
      search: search as string,
      status: status as string,
      minBookings,
      maxBookings
    });

    return sendResponse(res, {
      ...data,
    });
  } catch (error: unknown) {
    logger.error(`AdminCustomerController.listCustomers Error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * POST /api/admin-customers
 */
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("AdminCustomerController: Create customer request");
    const data = await AdminCustomerService.createCustomer(req.body);

    return sendResponse(res, MESSAGES.CUSTOMER.CREATED, data, STATUS_CODE.CREATED);
  } catch (error: unknown) {
    logger.error(`AdminCustomerController.createCustomer Error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * PATCH /api/admin-customers/:id/status
 */
export const updateCustomerStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;

    logger.info(`AdminCustomerController: Update customer status request for id ${id}`);
    
    const data = await AdminCustomerService.updateCustomerStatus(id, isActive);

    return sendResponse(res, MESSAGES.CUSTOMER.STATUS_UPDATED(isActive), data);
  } catch (error: unknown) {
    logger.error(`AdminCustomerController.updateCustomerStatus Error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * DELETE /api/admin-customers/delete-customer/:id
 */
export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    logger.info(`AdminCustomerController: Delete customer request for id ${id}`);
    
    await AdminCustomerService.deleteCustomer(id);

    return sendResponse(res, MESSAGES.CUSTOMER.DELETED);
  } catch (error: unknown) {
    logger.error(`AdminCustomerController.deleteCustomer Error: ${getErrorMessage(error)}`);
    next(error);
  }
};
