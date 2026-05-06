import { Request, Response, NextFunction } from "express";
import * as SubCategoryService from "../services/subCategory.service";
import logger from "../utils/logger";
import { sendResponse } from "@/utils/response.util";
import { CLOUDINARY_FOLDERS, uploadImage } from "@/utils/cloudinary.util";
import { ApiError } from "@/utils/apiError.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";

/**
 * Get SubCategories by Category ID
 */
export const getSubCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;
    const data = await SubCategoryService.getSubCategoriesByCategory(categoryId as string);
    return sendResponse(res, undefined, data);
  } catch (error: any) {
    logger.error(error.message);
    next(error);
  }
};

/**
 * Add a new SubCategory
 */
export const createSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info("Create SubCategory request");
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!req.file) {
      throw new ApiError(400, "Image is mandatory");
    }

    const uploadResult = await uploadImage(
      req.file,
      `${CLOUDINARY_FOLDERS.SERVICE_TYPE}/sub_categories`
    );
    
    const data = await SubCategoryService.createSubCategory(
      categoryId as string,
      name.trim(),
      uploadResult.url,
      uploadResult.publicId
    );
    
    return sendResponse(res, MESSAGES.SUBCATEGORY.CREATED, data, STATUS_CODE.CREATED);
  } catch (error: any) {
    logger.error(error.message);
    next(error);
  }
};

/**
 * Delete a SubCategory
 */
export const deleteSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await SubCategoryService.deleteSubCategory(id as string);
    return sendResponse(res, MESSAGES.SUBCATEGORY.DELETED);
  } catch (error: any) {
    logger.error(error.message);
    next(error);
  }
};
