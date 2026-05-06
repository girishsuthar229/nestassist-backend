import { Category, Service, ServiceType, SubCategory, ServicePartner } from "@/models";
import { ApiError } from "../utils/apiError.util";
import { CLOUDINARY_FOLDERS, deleteImage, uploadImage } from "../utils/cloudinary.util";
import logger from "../utils/logger";
import { col, fn, Op } from "sequelize";
import { PublicAllServiceType, PublicServiceListQuery, ServiceListResponse } from "@/dtos/serviceType.dto";
import Booking from "@/models/booking.model";
import { BookingStatus } from "@/enums/transaction.enum";
import { clearLandingHomeCache } from "@/utils/caching-utils/landingCache.util";
import { CategoryModelLike, ServiceCountRow } from "@/interfaces/serviceType.interface";
import { STATUS_CODE } from "@/enums";
import { MESSAGES } from "@/constants/messages";

/**
 * Create a new Service Type
 * @param name Service Type name
 * @param file Optional new main image
 * @param bannerFile Optional new banner image
 */
export const updateServiceType = async (
  id: string,
  name?: string,
  file?: Express.Multer.File,
  bannerFile?: Express.Multer.File
) => {
  logger.info(`ServiceTypeService: Updating service type ID: ${id}`);

  const item = await ServiceType.findByPk(id);
  if (!item) {
    logger.warn(`Service type not found ID: ${id}`);
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.COMMON.NOT_FOUND);
  }

  if (name) {
    const dup = await ServiceType.findOne({ where: { name } });
    if (dup && dup.id !== +id) {
      logger.warn(`Duplicate name attempted on update: ${name}`);
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.COMMON.NAME_DUPLICATE);
    }
    item.name = name;
  }

  // Update Main Image
  if (file) {
    // Delete old image if exists
    if (item.cloudinaryId) {
      await deleteImage(item.cloudinaryId).catch(err => logger.error(`Failed to delete old image: ${err.message}`));
    }
    const result = await uploadImage(file, `${CLOUDINARY_FOLDERS.SERVICE_TYPE}/icon`);
    item.image = result.url;
    item.cloudinaryId = result.publicId;
  }

  // Update Banner Image
  if (bannerFile) {
    // Delete old banner if exists
    if (item.bannerCloudinaryId) {
      await deleteImage(item.bannerCloudinaryId).catch(err => logger.error(`Failed to delete old banner: ${err.message}`));
    }
    const result = await uploadImage(bannerFile, `${CLOUDINARY_FOLDERS.SERVICE_TYPE}/banner_image`);
    item.bannerImage = result.url;
    item.bannerCloudinaryId = result.publicId;
  }

  clearLandingHomeCache();

  await item.save();
  logger.info(`ServiceType updated ID: ${item.id}`);
  return item;
};

/**
 * @name getServiceTypes
 * @description Returns all service types with pagination.
 * @access Private
 */
export const getServiceTypes = async (query: { page?: number; limit?: number }) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.max(1, Number(query.limit || 10));
  const offset = (page - 1) * limit;

  logger.info(`ServiceTypeService: Fetching service types with page: ${page}, limit: ${limit}`);
  
  const { rows, count } = await ServiceType.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows,
    pagination: {
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      limit,
    },
  };
};

/**
 * @name getAllServiceTypes
 * @description Returns service types with a computed total completed bookings count across nested categories/subcategories/services.
 * @access Private
 */
export const getAllServiceTypes = async (): Promise<PublicAllServiceType[]> => {
  const serviceTypes = await ServiceType.findAll({
    attributes: [
      "id",
      "name",
      "image",
      "bannerImage",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: Category,
        as: "categories",
        required: false,
        attributes: ["id"],
        include: [
          {
            model: SubCategory,
            as: "subcategories",
            required: false,
            attributes: ["id"],
            include: [
              {
                model: Service,
                as: "services",
                required: false,
                attributes: ["id"],
                include: [
                  {
                    model: Booking,
                    as: "bookings",
                    required: false,
                    attributes: ["id", "status"],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
  
  return serviceTypes.map((serviceType: any): PublicAllServiceType => {
    let totalBookings = 0;

    for (const category of serviceType.categories || []) {
      for (const sub of category.subcategories || []) {
        for (const service of sub.services || []) {
          const completedBookings =
            service.bookings?.filter(
              (b: any) => String(b.status) === BookingStatus.COMPLETED,
            ) ||
            [];

          totalBookings += completedBookings.length;
        }
      }
    }

    return {
      id: serviceType.id,
      name: serviceType.name,
      image: serviceType.image,
      bannerImage: serviceType.bannerImage,
      bookings: totalBookings,
      createdAt: serviceType.createdAt,
      updatedAt: serviceType.updatedAt,
    };
  });
};

/**
 * Get Service Type by ID
 * @param id Service Type ID
 */
export const getServiceTypeById = async (id: string) => {
  logger.info(`ServiceTypeService: Fetching service type ID: ${id}`);

  const serviceType = await ServiceType.findByPk(id, {
    include: [
      {
        model: Category,
        as: "categories",
        required: false,
        include: [
          {
            model: SubCategory,
            as: "subcategories",
            required: false,
            include: [
              {
                model: Service,
                as: "services",
                required: false,
              },
            ],
          },
        ],
      },
    ],
  });

  if (!serviceType) {
    logger.warn(`Service type not found ID: ${id}`);
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SERVICE_TYPE.NOT_FOUND);
  }

  // Calculate total services count
  let totalServices = 0;
  const serviceTypeAny = serviceType as any;
  const categories = serviceTypeAny.categories as any[] | undefined;
  if (Array.isArray(categories)) {
    for (const category of categories) {
      const subcategories = category.subcategories as any[] | undefined;
      if (Array.isArray(subcategories)) {
        for (const subcategory of subcategories) {
          const services = subcategory.services as any[] | undefined;
          if (Array.isArray(services)) {
            totalServices += services.filter((service) => service.availability === true).length;
          }
        }
      }
    }
  }

  // Add totalServices count to the response
  const serviceTypeData = serviceType.toJSON();
  (serviceTypeData as any).totalServices = totalServices;

  return serviceTypeData;
};

/**
 * @name getPublicServices
 * @description Lists available services for a service type with search/subcategory filtering and offset-based pagination ("load more").
 * @access Private
 */
export const getPublicServices = async (serviceTypeId: string, query: PublicServiceListQuery): Promise<ServiceListResponse> => {
  const limit = Math.min(50, Math.max(1, query.limit ?? 12));
  const offset = Math.max(0, query.offset ?? 0);

  const where: any = {
    availability: true // Only show available services
  };

  // Search by service name only
  if (query.q?.trim()) {
    where.name = { [Op.iLike]: `%${query.q.trim()}%` };
  }

  // Filter by subcategory ID
  if (typeof query.subCategoryId === "number" && !Number.isNaN(query.subCategoryId)) {
    where.subCategoryId = query.subCategoryId;
  }

  logger.info(
    `PublicService: Getting services for serviceTypeId=${serviceTypeId} - search=${query.q}, subCategoryId=${query.subCategoryId}, offset=${offset}, limit=${limit}`
  );

  const { rows, count } = await Service.findAndCountAll({
    where,
    include: [
      {
        model: SubCategory,
        as: "subCategory",
        required: true,
        include: [
          {
            model: Category,
            as: "category",
            required: true,
            where: {
              serviceTypeId: parseInt(serviceTypeId, 10)
            },
            include: [
              {
                model: ServiceType,
                as: "serviceType",
                required: true
              }
            ]
          }
        ]
      }
    ],
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"]
    ],
    limit,
    offset,
  });

  const hasMore = offset + rows.length < count;
  const nextOffset = hasMore ? offset + limit : undefined;

  return {
    data: rows.map(service => ({
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration,
      images: service.images,
      includeServices: service.includeServices,
      excludeServices: service.excludeServices,
    })),
    hasMore,
    nextOffset,
    pagination: {
      totalItems: count,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
      limit,
    },
  };
};

/**
 * Update Service Type
 * @param id Service Type ID
 * @param name Optional new name
 * @param file Optional new image
 */
export const createServiceType = async (
  name: string, 
  file?: Express.Multer.File,
  bannerFile?: Express.Multer.File
) => {
  logger.info(`ServiceTypeService: Creating service type with name: ${name}`);

  let imageUrl = "";
  let cloudinaryId = "";
  let bannerImageUrl = "";
  let bannerCloudinaryId = "";

  const exists = await ServiceType.findOne({ where: { name } });
  if (exists) {
    logger.warn(`Duplicate service type name attempted: ${name}`);
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.COMMON.NAME_DUPLICATE);
  }

  // Handle Main Image
  if (file) {
    const result = await uploadImage(file, `${CLOUDINARY_FOLDERS.SERVICE_TYPE}/icon`);
    imageUrl = result.url;
    cloudinaryId = result.publicId;
  }

  // Handle Banner Image
  if (bannerFile) {
    const result = await uploadImage(bannerFile, `${CLOUDINARY_FOLDERS.SERVICE_TYPE}/banner_image`);
    bannerImageUrl = result.url;
    bannerCloudinaryId = result.publicId;
  }

  clearLandingHomeCache();

  return ServiceType.create({ 
    name, 
    image: imageUrl, 
    cloudinaryId,
    bannerImage: bannerImageUrl,
    bannerCloudinaryId
  });
};

/**
 * Delete Service Type
 * @param id Service Type ID
 */
export const deleteServiceType = async (id: string) => {
  logger.info(`ServiceTypeService: Deleting service type ID: ${id}`);

  const item = await ServiceType.findByPk(id);
  if (!item) throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SERVICE_TYPE.NOT_FOUND);

  // Check if any Categories depend on this ServiceType
  const categoryCount = await Category.count({ where: { serviceTypeId: parseInt(id, 10) } });
  if (categoryCount > 0) {
    logger.warn(`Cannot delete ServiceType ID: ${id} because it has ${categoryCount} categories attached.`);
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SERVICE_TYPE.CANNOT_DELETE);
  }

  if (item.cloudinaryId) {
    try {
      await deleteImage(item.cloudinaryId);
      logger.info(`Deleted Cloudinary image: ${item.cloudinaryId}`);
    } catch (err: any) {
      logger.error(`Failed to delete Cloudinary image: ${err.message}`);
    }
  }

  if (item.bannerCloudinaryId) {
    try {
      await deleteImage(item.bannerCloudinaryId);
      logger.info(`Deleted Cloudinary image: ${item.bannerCloudinaryId}`);
    } catch (err: any) {
      logger.error(`Failed to delete Cloudinary image: ${err.message}`);
    }
  }

  clearLandingHomeCache();
  await item.destroy();
  logger.info(`Deleted ServiceType ID: ${id}`);
};

/**
 * @name getServiceTypesHierarchy
 * @description Returns service types with nested categories/sub-categories and attaches per-category servicesCount for hierarchy screens.
 * @access Private
 */
export const getServiceTypesHierarchy = async () => {
  logger.info("ServiceTypeService: Fetching service types hierarchy");
  const serviceTypes = await ServiceType.findAll({
    include: [
      {
        model: Category,
        as: "categories",
        required: false,
        include: [
          {
            model: SubCategory,
            as: "subcategories",
            required: false,
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const serviceCountsByCategory = await Service.findAll({
    attributes: ["categoryId", [fn("COUNT", col("id")), "servicesCount"]],
    group: ["categoryId"],
    raw: true,
  });

  const countMap = new Map<number, number>();
  for (const row of serviceCountsByCategory as unknown as ServiceCountRow[]) {
    const categoryId = Number(row.categoryId);
    const servicesCount = Number(row.servicesCount);
    if (!Number.isNaN(categoryId)) {
      countMap.set(categoryId, Number.isFinite(servicesCount) ? servicesCount : 0);
    }
  }

  for (const serviceType of serviceTypes) {
    const categories = (serviceType as unknown as Record<string, unknown>)
      .categories;
    if (!Array.isArray(categories)) continue;
    for (const category of categories) {
      const model = category as unknown as CategoryModelLike;
      const categoryId = Number(model.id);
      model.setDataValue?.("servicesCount", countMap.get(categoryId) ?? 0);
    }
  }

  return serviceTypes;
};

/**
 * @name getPartnerServiceTypesHierarchy
 * @description Returns the hierarchy scoped to a service partner’s service type, and attaches per-category servicesCount.
 * @access Private
 */
export const getPartnerServiceTypesHierarchy = async (partnerId: string) => {
  logger.info(
    `PartnerServiceTypeService: Fetching partner service types hierarchy for partnerId=${partnerId}`
  );

  // 1. Get the service_type_id for the given partnerId
  const partner = await ServicePartner.findOne({
    where: { userId: partnerId },
  });

  if (!partner) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.EXPERT.NOT_FOUND_PARTNER);
  }

  // 2. Fetch hierarchy only for the partner's service type
  const serviceTypes = await ServiceType.findAll({
    where: {
      id: partner.serviceTypeIds,
    },
    include: [
      {
        model: Category,
        as: "categories",
        required: false,
        include: [
          {
            model: SubCategory,
            as: "subcategories",
            required: false,
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const serviceCountsByCategory = await Service.findAll({
    attributes: ["categoryId", [fn("COUNT", col("id")), "servicesCount"]],
    group: ["categoryId"],
    raw: true,
  });

  const countMap = new Map<number, number>();
  for (const row of serviceCountsByCategory as unknown as ServiceCountRow[]) {
    const categoryId = Number(row.categoryId);
    const servicesCount = Number(row.servicesCount);
    if (!Number.isNaN(categoryId)) {
      countMap.set(
        categoryId,
        Number.isFinite(servicesCount) ? servicesCount : 0
      );
    }
  }

  for (const serviceType of serviceTypes) {
    const categories = (serviceType as unknown as Record<string, unknown>)
      .categories;
    if (!Array.isArray(categories)) continue;
    for (const category of categories) {
      const model = category as unknown as CategoryModelLike;
      const categoryId = Number(model.id);
      model.setDataValue?.("servicesCount", countMap.get(categoryId) ?? 0);
    }
  }

  return serviceTypes;
};
