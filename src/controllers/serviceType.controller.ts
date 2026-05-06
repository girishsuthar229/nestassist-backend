import { Request, Response, NextFunction } from "express";
import * as service from "../services/serviceType.service";
import logger from "../utils/logger";
import { getErrorMessage, parseNumber } from "@/utils/common.utils";
import { UserRole } from "@/enums/userRole.enum";
import { sendResponse } from "@/utils/response.util";
import { ApiError } from "@/utils/apiError.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";

/**
 * Create Service Type
 */
export const create = async (req: Request, res: Response, next: NextFunction) => {
  const partnerId =
      req.user?.role === UserRole.SERVICE_PARTNER ? req.user.id : undefined;

  if (partnerId) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.SERVICE_TYPE.ADMIN_ONLY_CREATE);
  }
  try {
    logger.info("Create ServiceType request");

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const image = files?.image ? files.image[0] : undefined;
    const bannerImage = files?.bannerImage ? files.bannerImage[0] : undefined;

    const data = await service.createServiceType(
      req.body.name.trim(),
      image,
      bannerImage
    );

    return sendResponse(res, MESSAGES.SERVICE.CREATED, data, STATUS_CODE.CREATED);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * Get all Service Types
 */
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getServiceTypes({
      page: parseNumber(req.query.page),
      limit: parseNumber(req.query.limit),
    });

    return sendResponse(res, { ...data });
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * As Public Users Get all Service Types
 */
export const getPublicUserAllService = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getAllServiceTypes();

    return sendResponse(res, undefined, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * Get Service Type by ID
 */
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getServiceTypeById(req.params.id as string);

    return sendResponse(res, undefined, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * GET /api/service-types/:id/services
 * Get services for a specific service type with search, subcategory filtering and load more
 * Route parameters:
 * - id: Service Type ID
 * Query parameters:
 * - q: Search term for service name
 * - subCategoryId: Filter by sub-category ID
 * - offset: Offset for load more functionality (default: 0)
 * - limit: Number of items to return (default: 12, max: 50)
 */
export const listServices = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getPublicServices(req.params.id as string, {
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      subCategoryId: parseNumber(req.query.subCategoryId),
      offset: parseNumber(req.query.offset),
      limit: parseNumber(req.query.limit),
    });

    return sendResponse(res, {
      ...data,
    });
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * Update Service Type
 */
export const update = async (req: Request, res: Response, next: NextFunction) => {
  const partnerId =
      req.user?.role === UserRole.SERVICE_PARTNER ? req.user.id : undefined;

  if (partnerId) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.SERVICE_TYPE.ADMIN_ONLY_UPDATE);
  }
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const image = files?.image ? files.image[0] : undefined;
    const bannerImage = files?.bannerImage ? files.bannerImage[0] : undefined;

    const data = await service.updateServiceType(
      req.params.id as string,
      req.body.name?.trim(),
      image,
      bannerImage
    );

    return sendResponse(res, MESSAGES.SERVICE_TYPE.UPDATED, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * Delete Service Type
 */
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  const partnerId =
      req.user?.role === UserRole.SERVICE_PARTNER ? req.user.id : undefined;

  if (partnerId) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.SERVICE_TYPE.ADMIN_ONLY_DELETE);
  }
  try {
    await service.deleteServiceType(req.params.id as string);

    return sendResponse(res, MESSAGES.SERVICE_TYPE.DELETED);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * Get all Service Types with nested Categories + SubCategories
 */
export const getAllHierarchy = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const partnerId =
      _req.user?.role === UserRole.SERVICE_PARTNER ? _req.user.sub : undefined;

    let data;
    if (!partnerId) {
      data = await service.getServiceTypesHierarchy();
    } else {
      data = await service.getPartnerServiceTypesHierarchy(partnerId);
    }

    return sendResponse(res, undefined, data);
  } catch (err: unknown) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};
