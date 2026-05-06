import { Request, Response, NextFunction } from "express";
import * as AdminUserService from "../services/adminUser.service";
import logger from "../utils/logger";
import { AdminUserFilterQuery } from "@/interfaces/adminUser.interface";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * @name listAdmins
 * @description
 * Fetch admin users with pagination, filtering and sorting.
 * Supports searching by name or email, and filtering by active status.
 * @access Private | Role-based
 */
export const listAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, sortBy, sortOrder, search, status } = req.query as AdminUserFilterQuery;

    const data = await AdminUserService.listAdminUsers({
      page: page || 1,
      limit: limit || 10,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "ASC" | "DESC") || "DESC",
      search: search as string,
      status: status as string,
    });

    return sendResponse(res, {
      ...data,
    });
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name createAdminUser
 * @description
 * Create a new admin user with the provided details.
 * Sends an email with credentials to the new admin user.
 * @access Private | Role-based
 */
export const createAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("AdminUserController: Create user request");
    const data = await AdminUserService.createAdminUser(req.body);

    return sendResponse(res, MESSAGES.USER.CREATED, data, STATUS_CODE.CREATED);
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name updateAdminUser
 * @description
 * Update an existing admin user's details by ID.
 * Supports updating name, email, password and active status.
 * @access Private | Role-based
 */
export const updateAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`AdminUserController: Update user request for id: ${req.params.id}`);
    const data = await AdminUserService.updateAdminUser(req.params.id as string, req.body);

    return sendResponse(res, MESSAGES.USER.UPDATED, data);
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name deleteAdminUser
 * @description
 * Delete an admin user by ID.
 * @access Private | Role-based
 */
export const deleteAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`AdminUserController: Delete user request for id: ${req.params.id}`);
    await AdminUserService.deleteAdminUser(req.params.id as string);

    return sendResponse(res, MESSAGES.USER.DELETED);
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};
