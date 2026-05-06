import { Request, Response, NextFunction, RequestHandler } from "express";
import * as CategoryService from "../services/category.service";
import logger from "../utils/logger";
import { CLOUDINARY_FOLDERS, uploadImage } from "@/utils/cloudinary.util";
import { ApiError } from "@/utils/apiError.util";
import { sendResponse, sendError } from "@/utils/response.util";
import { CreateCategoryDto } from "@/dtos/category.dto";
import { CreateSubCategoryDto } from "@/dtos/subCategory.dto";
import { ServiceType } from "@/models";
import { UserRole } from "@/enums/userRole.enum";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * Get Categories by Service Type ID
 */
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceTypeId } = req.params;
    const { excludeEmpty } = req.query;
    const data = await CategoryService.getCategoriesByServiceType(
      serviceTypeId as string, 
      excludeEmpty === 'true'
    );
    return sendResponse(res, MESSAGES.CATEGORY.FETCHED, data);
  } catch (error: unknown) {
    logger.error(`Login error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * Get Categories by multiple Service Type IDs
 * Query: ?ids=1,2,3&excludeEmpty=true
 */
export const getCategoriesMultiple = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, excludeEmpty } = req.query;

    if (!ids || typeof ids !== 'string') {
      return sendError(res, 'Query parameter "ids" is required (comma-separated service type IDs)', STATUS_CODE.BAD_REQUEST);
    }

    const serviceTypeIds = ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (serviceTypeIds.length === 0) {
      return sendError(res, 'At least one service type ID is required', STATUS_CODE.BAD_REQUEST);
    }

    const data = await CategoryService.getCategoriesByMultipleServiceTypes(
      serviceTypeIds,
      excludeEmpty === 'true'
    );
    return sendResponse(res, MESSAGES.CATEGORY.FETCHED, data);
  } catch (error: unknown) {
    logger.error(`getCategoriesMultiple error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * Add a new Category
 */
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const partnerId =
      req.user?.role === UserRole.SERVICE_PARTNER ? req.user.id : undefined;

  if (partnerId) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.CATEGORY.ADMIN_ONLY_CREATE);
  }
  try {
    logger.info("Create Category request");
    const { serviceTypeId } = req.params;
    const { name } = req.body;

    if (!req.file) {
      throw new ApiError(400, "Image is mandatory");
    }

    const uploadResult = await uploadImage(
      req.file,
      `${CLOUDINARY_FOLDERS.SERVICE_TYPE}/categories`
    );
    
    const data = await CategoryService.createCategory(
      serviceTypeId as string,
      name.trim(),
      uploadResult.url,
      uploadResult.publicId
    );
    
    return sendResponse(res, MESSAGES.CATEGORY.CREATED, data, STATUS_CODE.CREATED);
  } catch (error: unknown) {
    logger.error(`Login error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * Delete a Category
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  const partnerId =
      req.user?.role === UserRole.SERVICE_PARTNER ? req.user.id : undefined;

  if (partnerId) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.CATEGORY.ADMIN_ONLY_DELETE);
  }
  try {
    const { id } = req.params;
    await CategoryService.deleteCategory(id as string);
    return sendResponse(res, MESSAGES.CATEGORY.DELETED);
  } catch (error: unknown) {
    logger.error(`Login error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * Bulk Create Categories and Subcategories
 */
export const bulkCreate: RequestHandler = async (req, res, next) => {
  const partnerId =
      req.user?.role === UserRole.SERVICE_PARTNER ? req.user.id : undefined;

  if (partnerId) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.CATEGORY.ADMIN_ONLY_CREATE);
  }
  try {
    // ── 0. Validate serviceTypeId ─────────────────────────────
    const rawServiceTypeId = req.params.serviceTypeId;
    const serviceTypeId = Array.isArray(rawServiceTypeId)
      ? rawServiceTypeId[0]
      : rawServiceTypeId;

    const parsedServiceTypeId = parseInt(serviceTypeId, 10);
    if (isNaN(parsedServiceTypeId)) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SERVICE_TYPE.INVALID_ID);
    }

    const item = await ServiceType.findByPk(parsedServiceTypeId);
    if (!item) throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SERVICE_TYPE.NOT_FOUND);

    // ── 1. Parse categories ───────────────────────────────────
    let categories = req.body.categories;

    if (typeof categories === "string") {
      try {
        categories = JSON.parse(categories);
      } catch {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CATEGORY.INVALID_FORMAT);
      }
    }

    if (!Array.isArray(categories)) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CATEGORY.MUST_BE_ARRAY);
    }

    // ── 2. Normalize + Deduplicate (NO THROW) ─────────────────
    const catSeen = new Set<string>();
    const skippedInRequest: string[] = [];
    const cleanedCategories: CreateCategoryDto[] = [];

    for (const rawCat of categories) {
      const catName = rawCat.name?.trim();
      if (!catName) continue;

      const key = catName.toLowerCase();

      if (catSeen.has(key)) {
        skippedInRequest.push(catName);
        continue;
      }

      catSeen.add(key);

      // clone object (avoid mutation)
      const cat: CreateCategoryDto = {
        ...rawCat,
        name: catName,
        subCategories: [],
      };

      // subcategory dedup
      if (rawCat.subCategories?.length) {
        const subSeen = new Set<string>();

        for (const rawSub of rawCat.subCategories) {
          const subName = rawSub.name?.trim();
          if (!subName) continue;

          const subKey = subName.toLowerCase();
          if (subSeen.has(subKey)) continue;

          subSeen.add(subKey);

          cat.subCategories!.push({
            ...rawSub,
            name: subName,
          });
        }
      }

      cleanedCategories.push(cat);
    }

    // ── 3. File mapping ───────────────────────────────────────
    const files = req.files;
    const fileMap: Record<string, Express.Multer.File> = {};

    if (Array.isArray(files)) {
      files.forEach((f) => (fileMap[f.fieldname] = f));
    } else if (files && typeof files === "object") {
      Object.entries(files).forEach(([key, arr]) => {
        if (Array.isArray(arr) && arr[0]) fileMap[key] = arr[0];
      });
    }

    // ── 4. Upload queue ───────────────────────────────────────
    const uploadQueue: {
      file: string | Express.Multer.File;
      target: CreateCategoryDto | CreateSubCategoryDto;
      folder: string;
    }[] = [];

    cleanedCategories.forEach((cat) => {
      if (cat.imageUrl?.startsWith("data:image/")) {
        uploadQueue.push({ file: cat.imageUrl, target: cat, folder: "categories" });
      } else if (cat.image && fileMap[cat.image]) {
        uploadQueue.push({ file: fileMap[cat.image], target: cat, folder: "categories" });
      } else if (cat.image && typeof cat.image === "string" && cat.image.startsWith("http")) {
        // It's an existing URL sent in the image field
        cat.imageUrl = cat.image;
      }

      if (!cat.imageUrl && !cat.image) {
        throw new ApiError(400, `Image is mandatory for category: ${cat.name}`);
      }

      cat.subCategories?.forEach((sub) => {
        if (sub.imageUrl?.startsWith("data:image/")) {
          uploadQueue.push({ file: sub.imageUrl, target: sub, folder: "sub_categories" });
        } else if (sub.image && fileMap[sub.image]) {
          uploadQueue.push({ file: fileMap[sub.image], target: sub, folder: "sub_categories" });
        } else if (sub.image && typeof sub.image === "string" && sub.image.startsWith("http")) {
          // It's an existing URL sent in the image field
          sub.imageUrl = sub.image;
        }

        if (!sub.imageUrl && !sub.image) {
          throw new ApiError(400, `Image is mandatory for sub-category: ${sub.name}`);
        }
      });
    });

    // ── 5. Safe concurrency upload ────────────────────────────
    const CONCURRENCY = 5;

    for (let i = 0; i < uploadQueue.length; i += CONCURRENCY) {
      const batch = uploadQueue.slice(i, i + CONCURRENCY);

      await Promise.all(
        batch.map(async (task) => {
          const result = await uploadImage(
            task.file,
            `${CLOUDINARY_FOLDERS.SERVICE_TYPE}/${task.folder}`
          );

          task.target.imageUrl = result.url;
          task.target.cloudinaryId = result.publicId;
        })
      );
    }

    // ── 6. Call service ───────────────────────────────────────
    const result = await CategoryService.bulkUpsertCategories(
      parsedServiceTypeId,
      cleanedCategories
    );

    return sendResponse(res, {
      message: MESSAGES.CATEGORY.BULK_UPSERT_COMPLETED,
      stats: {
        ...result.stats,
        skippedInRequest,
      },
    });
  } catch (error: unknown) {
    logger.error(`Login error: ${getErrorMessage(error)}`);
    next(error);
  }
};