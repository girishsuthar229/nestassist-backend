import { Op } from "sequelize";
import { Category, Service, SubCategory } from "../models";
import sequelize from "@/configs/db";
import { ApiError } from "../utils/apiError.util";
import logger from "../utils/logger";
import { CreateCategoryDto } from "@/dtos/category.dto";
import { deleteImage } from "@/utils/cloudinary.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";

/**
 * Get all Categories for a Service Type
 * @param serviceTypeId ID of the service type
 */
export const getCategoriesByServiceType = async (serviceTypeId: string, excludeEmpty: boolean = false) => {
  logger.info(`CategoryService: Fetching categories for serviceTypeId: ${serviceTypeId}`);

  const categories = await Category.findAll({
    where: { serviceTypeId: parseInt(serviceTypeId, 10) },
    include: [
      {
        model: SubCategory,
        as: 'subcategories',
        include: [
          {
            model: Service,
            as: 'services',
            required: false
          }
        ]
      }
    ]
  });

  // Convert to JSON, add service count, and remove services from response
  let categoriesData = categories.map(category => category.toJSON()) as any[];
  for (const category of categoriesData) {
    const subcategories = category.subcategories as any[] | undefined;
    if (Array.isArray(subcategories)) {
      for (const subcategory of subcategories) {
        const services = subcategory.services as any[] | undefined;
        subcategory.serviceCount = Array.isArray(services) ? services.filter((service) => service.availability === true).length : 0;
        delete subcategory.services;
      }
    }
  }

  if (excludeEmpty) {
    categoriesData = categoriesData.filter(category => {
      return Array.isArray(category.subcategories) && category.subcategories.length > 0;
    });
  }

  return categoriesData;
};

/**
 * Get all Categories for multiple Service Types in a single query
 * @param serviceTypeIds Array of service type ID strings
 * @param excludeEmpty Whether to exclude categories with no subcategories
 */
export const getCategoriesByMultipleServiceTypes = async (
  serviceTypeIds: string[],
  excludeEmpty: boolean = false
) => {
  const parsedIds = serviceTypeIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));

  logger.info(`CategoryService: Fetching categories for serviceTypeIds: [${parsedIds.join(', ')}]`);

  const categories = await Category.findAll({
    where: { serviceTypeId: { [Op.in]: parsedIds } },
    include: [
      {
        model: SubCategory,
        as: 'subcategories',
        include: [
          {
            model: Service,
            as: 'services',
            required: false,
          },
        ],
      },
    ],
    order: [['serviceTypeId', 'ASC'], ['name', 'ASC']],
  });

  // Convert to JSON and compute serviceCount per subcategory
  let categoriesData = categories.map((category) => category.toJSON()) as any[];
  for (const category of categoriesData) {
    const subcategories = category.subcategories as any[] | undefined;
    if (Array.isArray(subcategories)) {
      for (const subcategory of subcategories) {
        const services = subcategory.services as any[] | undefined;
        subcategory.serviceCount = Array.isArray(services)
          ? services.filter((s) => s.availability === true).length
          : 0;
        delete subcategory.services;
      }
    }
  }

  if (excludeEmpty) {
    categoriesData = categoriesData.filter(
      (category) => Array.isArray(category.subcategories) && category.subcategories.length > 0
    );
  }

  return categoriesData;
};

/**
 * Create a new Category
 * @param serviceTypeId ID of the service type
 * @param name Category name
 * @param imageUrl Category image URL
 * @param cloudinaryId Category image Cloudinary ID
 */
export const createCategory = async (serviceTypeId: string, name: string, imageUrl: string, cloudinaryId: string) => {
  logger.info(`CategoryService: Creating category '${name}' for serviceTypeId: ${serviceTypeId}`);

  const parsedServiceTypeId = parseInt(serviceTypeId, 10);

  const exists = await Category.findOne({ where: { name, serviceTypeId: parsedServiceTypeId } });
  if (exists) {
    logger.warn(`Duplicate category name attempted: ${name} for serviceTypeId: ${serviceTypeId}`);
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CATEGORY.NAME_EXISTS);
  }

  return Category.create({ name, serviceTypeId: parsedServiceTypeId, imageUrl, cloudinaryId });
};

/**
 * Delete a Category
 * @param id Category ID
 */
export const deleteCategory = async (id: string) => {
  logger.info(`CategoryService: Deleting category ID: ${id}`);

  const item = await Category.findByPk(id);
  if (!item) {
    logger.warn(`Category not found ID: ${id}`);
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.CATEGORY.NOT_FOUND);
  }

  // Check if any Categories depend on this ServiceType
  const subCategoryCount = await SubCategory.count({ where: { categoryId: item.id } });
  if (subCategoryCount > 0) {
    logger.warn(`Cannot delete Categories ID: ${id} because it has ${subCategoryCount} sub-categories attached.`);
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CATEGORY.CANNOT_DELETE_HAS_SUBCATEGORIES);
  }

  const serviceCount = await Service.count({ where: { categoryId: item.id } });
  if (serviceCount > 0) {
    logger.warn(`Cannot delete Category ID: ${id} because it has ${serviceCount} services attached.`);
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CATEGORY.CANNOT_DELETE_HAS_SERVICES);
  }

  
  if (item.cloudinaryId) {
    try {
      await deleteImage(item.cloudinaryId);
      logger.info(`Deleted Cloudinary image: ${item.cloudinaryId}`);
    } catch (err: any) {
      logger.error(`Failed to delete Cloudinary image: ${err.message}`);
    }
  }

  await item.destroy();
  logger.info(`Deleted Category ID: ${id}`);
};

/**
 * Bulk Upsert Categories and Subcategories 
 */
export const bulkUpsertCategories = async (
  serviceTypeId: number,
  categoriesData: CreateCategoryDto[]
) => {
  const t = await sequelize.transaction();

  try {
    // 1. Fetch current state
    const existingCategories = await Category.findAll({
      where: { serviceTypeId },
      include: [{ model: SubCategory, as: "subcategories" }],
      transaction: t,
    });

    const stats = {
      createdCategories: 0,
      updatedCategories: 0,
      createdSubCategories: 0,
      updatedSubCategories: 0,
    };

    // 2. Process Input
    for (const cat of categoriesData) {
      let category: Category | null = null;

      // Match by ID or Name
      if (cat.id) {
        category = existingCategories.find((c) => c.id === cat.id) ?? null;
      } else {
        category = existingCategories.find(
          (c) => c.name.toLowerCase() === cat.name.trim().toLowerCase()
        ) ?? null;
      }

      if (category) {
        // Update existing category
        await category.update(
          {
            name: cat.name.trim(),
            imageUrl: cat.imageUrl !== undefined ? cat.imageUrl : category.imageUrl,
            cloudinaryId: cat.cloudinaryId !== undefined ? cat.cloudinaryId : category.cloudinaryId,
          },
          { transaction: t }
        );
        stats.updatedCategories++;
      } else {
        // Create new category
        category = await Category.create(
          {
            name: cat.name.trim(),
            serviceTypeId,
            imageUrl: cat.imageUrl,
            cloudinaryId: cat.cloudinaryId,
          },
          { transaction: t }
        );
        stats.createdCategories++;
      }

      // Process Subcategories for this category
      const existingSubs = category.subcategories || [];
      
      if (cat.subCategories) {
        for (const sub of cat.subCategories) {
          let subCategory: SubCategory | null = null;

          if (sub.id) {
            subCategory = existingSubs.find((s) => s.id === sub.id) ?? null;
          } else {
            subCategory = existingSubs.find(
              (s) => s.name.toLowerCase() === sub.name.trim().toLowerCase()
            ) ?? null;
          }

          if (subCategory) {
            // Update existing subcategory
            await subCategory.update(
              {
                name: sub.name.trim(),
                imageUrl: sub.imageUrl !== undefined ? sub.imageUrl : subCategory.imageUrl,
                cloudinaryId: sub.cloudinaryId !== undefined ? sub.cloudinaryId : subCategory.cloudinaryId,
              },
              { transaction: t }
            );
            stats.updatedSubCategories++;
          } else {
            // Create new subcategory
            const newSub = await SubCategory.create(
              {
                name: sub.name.trim(),
                categoryId: category.id,
                imageUrl: sub.imageUrl,
                cloudinaryId: sub.cloudinaryId,
              },
              { transaction: t }
            );
            stats.createdSubCategories++;
          }
        }
      }
    }

    await t.commit();
    return { stats };
  } catch (err) {
    await t.rollback();
    logger.error(`bulkUpsertCategories failed: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
};

