import { deleteImage } from "@/utils/cloudinary.util";
import { Service, SubCategory } from "../models";
import { ApiError } from "../utils/apiError.util";
import logger from "../utils/logger";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";

/**
 * Get all SubCategories for a Category
 * @param categoryId ID of the category
 */
export const getSubCategoriesByCategory = async (categoryId: string) => {
  logger.info(`SubCategoryService: Fetching subcategories for categoryId: ${categoryId}`);
  return SubCategory.findAll({ where: { categoryId: parseInt(categoryId, 10) } });
};

/**
 * Create a new SubCategory
 * @param categoryId ID of the category
 * @param name SubCategory name
 * @param imageUrl SubCategory image URL
 * @param cloudinaryId SubCategory image Cloudinary ID
 */
export const createSubCategory = async (categoryId: string, name: string, imageUrl: string, cloudinaryId: string) => {
  logger.info(`SubCategoryService: Creating subcategory '${name}' for categoryId: ${categoryId}`);
  
  const parsedCategoryId = parseInt(categoryId, 10);
  
  const exists = await SubCategory.findOne({ where: { name, categoryId: parsedCategoryId } });
  if (exists) {
    logger.warn(`Duplicate subcategory name attempted: ${name} for categoryId: ${categoryId}`);
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SUBCATEGORY.NAME_EXISTS);
  }

  return SubCategory.create({ name, categoryId: parsedCategoryId, imageUrl, cloudinaryId });
};

/**
 * Delete a SubCategory
 * @param id SubCategory ID
 */
export const deleteSubCategory = async (id: string) => {
  logger.info(`SubCategoryService: Deleting subcategory ID: ${id}`);

  const item = await SubCategory.findByPk(id);
  if (!item) {
    logger.warn(`SubCategory not found ID: ${id}`);
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SUBCATEGORY.NOT_FOUND);
  }

  const serviceCount = await Service.count({ where: { subCategoryId: item.id } });
  if (serviceCount > 0) {
    logger.warn(`Cannot delete SubCategory ID: ${id} because it has ${serviceCount} services attached.`);
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SUBCATEGORY.CANNOT_DELETE_HAS_SERVICES);
  }

  // // Check if any Categories depend on this ServiceType
  // const serviceManagementCount = await ServiceManagement.count({ where: { subCategoryId: item.id } });
  // if (serviceManagementCount > 0) {
  //   logger.warn(`Cannot delete SubCategories ID: ${id} because it has ${serviceManagementCount} subCategories attached.`);
  //   throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SUBCATEGORY.CANNOT_DELETE_HAS_SERVICE_MANAGEMENT);
  // }

  
  if (item.cloudinaryId) {
    try {
      await deleteImage(item.cloudinaryId);
      logger.info(`Deleted Cloudinary image: ${item.cloudinaryId}`);
    } catch (err: any) {
      logger.error(`Failed to delete Cloudinary image: ${err.message}`);
    }
  }

  await item.destroy();
  logger.info(`Deleted SubCategory ID: ${id}`);
};
