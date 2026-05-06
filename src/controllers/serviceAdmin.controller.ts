import { Request, Response, NextFunction } from "express";
import * as service from "../services/serviceAdmin.service";
import logger from "../utils/logger";
import {
  getErrorMessage,
  parseAvailability,
  parseNumber,
  parseStringArray,
} from "@/utils/common.utils";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";

/**
 * GET /api/categories/:categoryId/services
 * Query:
 * - q
 * - page, limit
 * - subCategoryId
 * - priceMin, priceMax
 * - availability (yes/no)
 * - commission
 */
export const listByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params;

    const data = await service.listServicesByCategory(categoryId as string, {
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      page: parseNumber(req.query.page),
      limit: parseNumber(req.query.limit),
      subCategoryId: parseNumber(req.query.subCategoryId),
      priceMin: parseNumber(req.query.priceMin),
      priceMax: parseNumber(req.query.priceMax),
      availability: parseAvailability(req.query.availability),
      commission: parseNumber(req.query.commission),
    },req.user);

    return sendResponse(res, {
      ...data,
    });
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * GET /api/services/:id
 */
export const getServiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const serviceData = await service.getService(req.params.id as string, {isAdmin: false, currentUser: req.user});

    return sendResponse(res, undefined, serviceData);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * GET /api/services/:id for admin
 */
export const getServiceByIdForAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const serviceData = await service.getService(req.params.id as string, {isAdmin: true, currentUser: req.user});


    return sendResponse(res, undefined, serviceData);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * POST /api/subcategories/:subCategoryId/services
 */
export const create = async (
  req: Request<{ categoryId: string; subCategoryId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const effectiveCategoryId = categoryId ?? req.body.categoryId;

    const files = (req.files ?? []) as Express.Multer.File[];

    const data = await service.createService(
      effectiveCategoryId as string,
      subCategoryId as string,
      {
        name: req.body.name,
        price: req.body.price,
        duration: parseNumber(req.body.duration),
        commission: req.body.commission,
        availability: req.body.availability,
        includeServices: parseStringArray(req.body.includeServices) ?? [],
        excludeServices: parseStringArray(req.body.excludeServices) ?? [],
      },
      files,
      req.user.sub
    );

    return sendResponse(res, MESSAGES.SERVICE.CREATED, data, STATUS_CODE.CREATED);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * PUT /api/services/:id
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = (req.files ?? []) as Express.Multer.File[];
    const data = await service.updateService(
      req.params.id as string,
      {
        name: req.body.name,
        price: req.body.price,
        duration: parseNumber(req.body.duration),
        commission: req.body.commission,
        availability: req.body.availability,
        subCategoryId: parseNumber(req.body.subCategoryId),
        includeServices: parseStringArray(req.body.includeServices),
        excludeServices: parseStringArray(req.body.excludeServices),
        deletedImages: parseStringArray(req.body.deletedImages),
      },
      files,
      req.user
    );

    return sendResponse(res, MESSAGES.SERVICE.UPDATED, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * PATCH /api/services/:id/availability
 */
export const updateAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await service.updateServiceAvailability(
      req.params.id as string,
      req.body.availability,
      req.user
    );

    return sendResponse(res, MESSAGES.SERVICE.AVAILABILITY_UPDATED, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * DELETE /api/services/:id
 */
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await service.deleteService(req.params.id as string, req.user);
    return sendResponse(res, MESSAGES.SERVICE.DELETED);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};
