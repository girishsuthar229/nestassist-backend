import { Request, Response, NextFunction } from "express";
import * as RoleService from "../services/role.service";
import logger from "../utils/logger";
import { RoleFilterQuery } from "@/interfaces/role.interface";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * @name listRoles
 * @description Fetch roles with filtering and sorting.
 * @access Private | Role-based
 */
export const listRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sortBy, sortOrder, search } = req.query as RoleFilterQuery;

    const data = await RoleService.listRoles({
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "ASC" | "DESC") || "DESC",
      search: search as string,
    });

    return sendResponse(res, { ...data });
  } catch (error: unknown) {
    logger.error(`Login error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * @name createRole
 * @description Create a new role.
 * @access Private | Role-based
 */
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("RoleController: Create role request");
    const data = await RoleService.createRole(req.body);

    return sendResponse(res, MESSAGES.ROLE.CREATED, data, STATUS_CODE.CREATED);
  } catch (error: unknown) {
    logger.error(`Login error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * @name updateRole
 * @description Update an existing role.
 * @access Private | Role-based
 */
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`RoleController: Update role request for id: ${req.params.id}`);
    const data = await RoleService.updateRole(req.params.id as string, req.body);

    return sendResponse(res, MESSAGES.ROLE.UPDATED, data);
  } catch (error: unknown) {
    logger.error(`Login error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * @name deleteRole
 * @description Delete a role by ID.
 * @access Private | Role-based
 */
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info(`RoleController: Delete role request for id: ${req.params.id}`);
    await RoleService.deleteRole(req.params.id as string);

    return sendResponse(res, MESSAGES.ROLE.DELETED);
  } catch (error: unknown) {
    logger.error(`Login error: ${getErrorMessage(error)}`);
    next(error);
  }
};
