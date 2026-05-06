import { Op } from "sequelize";
import { Category, Service, SubCategory, ServiceType, User, Role } from "@/models";
import { ApiError } from "../utils/apiError.util";
import {
  CLOUDINARY_FOLDERS,
  deleteImage,
  uploadImage,
} from "../utils/cloudinary.util";
import logger from "../utils/logger";
import { ServiceListQuery } from "@/interfaces/services.interface";
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from "@/dtos/services.dto";
import { clearLandingHomeCache } from "@/utils/caching-utils/landingCache.util";
import { clearServiceAdminCache } from "@/utils/caching-utils/serviceAdminCache.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { serviceAdminRepository } from "@/repositories/serviceAdmin.repository";
import { UserRole } from "@/enums/userRole.enum";

/**
 * @name listServicesByCategory
 * @description Lists services under a category with filters (query text, price range, availability, commission) and pagination.
 * @access Private
 */
export const listServicesByCategory = async (
  categoryId: string,
  query: ServiceListQuery,
  currentUser: { sub: number; role: string },
) => {
  const parsedCategoryId = parseInt(categoryId, 10);
  if (Number.isNaN(parsedCategoryId))
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CATEGORY.INVALID_ID);

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 10));
  const offset = (page - 1) * limit;

  const where: Record<PropertyKey, unknown> = {};

  if (query.q?.trim()) {
    where[Op.or] = [{ name: { [Op.iLike]: `%${query.q.trim()}%` } }];
  }

  if (typeof query.availability === "boolean") {
    where.availability = query.availability;
  }

  if (typeof query.commission === "number" && !Number.isNaN(query.commission)) {
    where.commission = query.commission;
  }

  if (
    typeof query.priceMin === "number" ||
    typeof query.priceMax === "number"
  ) {
    where.price = {
      ...(typeof query.priceMin === "number"
        ? { [Op.gte]: query.priceMin }
        : {}),
      ...(typeof query.priceMax === "number"
        ? { [Op.lte]: query.priceMax }
        : {}),
    };
  }

  logger.info(
    `ServiceAdminService: Listing services for categoryId=${categoryId}, page=${page}, limit=${limit}`,
  );

  where.categoryId = parsedCategoryId;
  if (
    typeof query.subCategoryId === "number" &&
    !Number.isNaN(query.subCategoryId)
  ) {
    where.subCategoryId = query.subCategoryId;
  }

  if (currentUser?.role === UserRole.SERVICE_PARTNER) {
    const adminRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    const admins = await User.findAll({
      attributes: ["id","name"],
      include: [
        {
          model: Role,
          as: "role",
          where: { name: adminRoles },
          attributes: [],
        },
      ],
    });
  }

  const { rows: rawData, count: totalItems } =
  await serviceAdminRepository.listServicesByCategory(where, limit, offset);

    // Transform data to remove redundant fields and flatten creator info
    const data = rawData.map((item: any) => {
      const plain = item.get({ plain: true });
      const creator = plain.creator;
      
      // Remove redundant associations and raw fields
      delete plain.creator;
      delete plain.created_by;
      
      return {
        ...plain,
        createdBy: creator?.id || plain.createdBy,
        creatorName: creator?.name || null,
        creatorRole: creator?.role?.name || null,
      };
    });

  return {
    data,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

/**
 * @name getService
 * @description Returns a service by id with its service type attached; blocks inactive services.
 * @access Private
 */
export const getService = async (
  serviceId: string,
  opts?: { isAdmin?: boolean; currentUser?: { sub: number; role: string } },
) => {
  const parsedServiceId = parseInt(serviceId, 10);
  if (Number.isNaN(parsedServiceId))
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.SERVICE.INVALID_SERVICE_ID,
    );

  const service = await serviceAdminRepository.getServiceById(parsedServiceId);

  if (!service) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SERVICE.NOT_FOUND);
  }

  if (service.availability !== true && opts?.isAdmin !== true) {
    throw new ApiError(
      STATUS_CODE.SERVICE_NOT_ACTIVE,
      MESSAGES.SERVICE.NOT_ACTIVE,
    );
  }


  const sub = service.get("subCategory") as unknown as
    | {
        get?: (key: string) => unknown;
        setDataValue?: (key: string, value: unknown) => void;
      }
    | undefined;
  const cat = sub?.get?.("category") as unknown as
    | {
        get?: (key: string) => unknown;
        setDataValue?: (key: string, value: unknown) => void;
      }
    | undefined;
  const st = cat?.get?.("serviceType") as unknown;
  const stId = (st as { id?: unknown } | null | undefined)?.id;
  const stName = (st as { name?: unknown } | null | undefined)?.name;
  if (typeof stId === "number" && typeof stName === "string") {
    service.setDataValue("serviceType", { id: stId, name: stName });
    cat?.setDataValue?.("serviceType", undefined);
  }

  const plain = service.get({ plain: true });
  const creator = plain.creator;
  
  delete plain.creator;
  delete plain.created_by;

  return {
    ...plain,
    createdBy: creator?.id || plain.createdBy,
    creatorName: creator?.name || null,
    creatorRole: creator?.role?.name || null,
  };
};

/**
 * @name createService
 * @description Creates a service under a category/sub-category, uploads images, and clears related caches.
 * @access Private
 */
export const createService = async (
  categoryId: string,
  subCategoryId: string,
  payload: CreateServiceRequestDto,
  files: Express.Multer.File[],
  createdBy: number,
) => {
  const parsedCategoryId = parseInt(categoryId, 10);
  const parsedSubCategoryId = parseInt(subCategoryId, 10);
  if (Number.isNaN(parsedCategoryId))
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CATEGORY.INVALID_ID);
  if (Number.isNaN(parsedSubCategoryId))
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.SUBCATEGORY.INVALID_ID,
    );

  const [category, subCategory] = await Promise.all([
    serviceAdminRepository.getCategoryById(parsedCategoryId),
    serviceAdminRepository.getSubCategoryById(parsedSubCategoryId),
  ]);
  if (!category)
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.CATEGORY.NOT_FOUND);
  if (!subCategory)
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SUBCATEGORY.NOT_FOUND);
  if (subCategory.categoryId !== parsedCategoryId) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.SUBCATEGORY.NOT_BELONG_TO_CATEGORY,
    );
  }

  const trimmedName = payload.name?.trim();
  if (!trimmedName)
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SERVICE.NAME_REQUIRED);

  const existing = await serviceAdminRepository.findDuplicateService(
    parsedCategoryId,
    parsedSubCategoryId,
    trimmedName,
  );
  if (existing) {
    throw new ApiError(
      STATUS_CODE.CONFLICT,
      MESSAGES.SERVICE.NAME_DUPLICATE_UNDER_SUBCATEGORY,
    );
  }

  const images: string[] = [];
  const cloudinaryIds: string[] = [];

  if (files.length) {
    for (const file of files) {
      const result = await uploadImage(file, CLOUDINARY_FOLDERS.SERVICE);
      images.push(result.url);
      cloudinaryIds.push(result.publicId);
    }
  }

  const created = await serviceAdminRepository.createService({
    name: trimmedName,
    price: payload.price,
    duration: payload.duration,
    commission: payload.commission ?? 0,
    availability: payload.availability ?? true,
    includeServices: payload.includeServices ?? [],
    excludeServices: payload.excludeServices ?? [],
    images,
    cloudinaryIds,
    categoryId: parsedCategoryId,
    subCategoryId: parsedSubCategoryId,
    createdBy,
  });

  clearLandingHomeCache();
  clearServiceAdminCache();
  return created;
};

/**
 * @name updateService
 * @description Updates service details and images (supports deletedImages); prevents duplicates within same category/sub-category; clears caches.
 * @access Private
 */
export const updateService = async (
  id: string,
  payload: UpdateServiceRequestDto,
  files: Express.Multer.File[],
  currentUser: { sub: number; role: string },
) => {
  const item = await serviceAdminRepository.getServiceEntity(id);
  if (!item)
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SERVICE.NOT_FOUND);

  
  // Ownership Check: Service Partners can only edit their own services
  if (
    currentUser.role === UserRole.SERVICE_PARTNER &&
    item.createdBy !== currentUser.sub
  ) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.AUTH.FORBIDDEN_ROLE);
  }

  let nextCategoryId = item.categoryId;
  let nextSubCategoryId = item.subCategoryId;
  if (payload.subCategoryId !== undefined) {
    const nextSub = await serviceAdminRepository.getSubCategoryById(
      payload.subCategoryId,
    );
    if (!nextSub)
      throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SUBCATEGORY.NOT_FOUND);
    nextSubCategoryId = nextSub.id;
    nextCategoryId = nextSub.categoryId;
  }

  const nextName = payload.name !== undefined ? payload.name.trim() : item.name;
  if (payload.name !== undefined && !nextName) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.SERVICE.NAME_REQUIRED);
  }

  if (payload.name !== undefined || payload.subCategoryId !== undefined) {
    const dup = await serviceAdminRepository.findDuplicateService(
      nextCategoryId,
      nextSubCategoryId,
      nextName,
      item.id,
    );
    if (dup) {
      throw new ApiError(
        STATUS_CODE.CONFLICT,
        MESSAGES.SERVICE.NAME_DUPLICATE_UNDER_SUBCATEGORY,
      );
    }
  }

  // Important: clone arrays before mutating. Sequelize tracks previous values by reference,
  // so in-place mutation can result in changes not being persisted to DB.
  let images = Array.isArray(item.images) ? [...item.images] : [];
  let cloudinaryIds = Array.isArray(item.cloudinaryIds)
    ? [...item.cloudinaryIds]
    : [];

  if (payload.deletedImages?.length) {
    const deleteSet = new Set(payload.deletedImages);

    const remainingImages: string[] = [];
    const remainingCloudinaryIds: string[] = [];

    for (let i = 0; i < cloudinaryIds.length; i++) {
      const publicId = cloudinaryIds[i];

      if (deleteSet.has(publicId)) {
        try {
          await deleteImage(publicId);
        } catch {
          // ignore failure
        }
      } else {
        remainingCloudinaryIds.push(publicId);
        remainingImages.push(images[i]);
      }
    }

    images = remainingImages;
    cloudinaryIds = remainingCloudinaryIds;
  }

  if (files?.length) {
    for (const file of files) {
      const result = await uploadImage(file, CLOUDINARY_FOLDERS.SERVICE);
      images.push(result.url);
      cloudinaryIds.push(result.publicId);
    }
  }

  await serviceAdminRepository.updateService(item, {
    ...(payload.name !== undefined ? { name: nextName } : {}),
    ...(payload.price !== undefined ? { price: payload.price } : {}),
    ...(payload.duration !== undefined ? { duration: payload.duration } : {}),
    ...(payload.commission !== undefined
      ? { commission: payload.commission }
      : {}),
    ...(payload.availability !== undefined
      ? { availability: payload.availability }
      : {}),
    ...(payload.subCategoryId !== undefined
      ? { subCategoryId: nextSubCategoryId, categoryId: nextCategoryId }
      : {}),
    ...(payload.includeServices !== undefined
      ? { includeServices: payload.includeServices }
      : {}),
    ...(payload.excludeServices !== undefined
      ? { excludeServices: payload.excludeServices }
      : {}),
    ...(images !== undefined ? { images } : {}),
    ...(cloudinaryIds !== undefined ? { cloudinaryIds } : {}),
  });

  clearLandingHomeCache();
  clearServiceAdminCache();
  return item;
};

/**
 * @name updateServiceAvailability
 * @description Updates a service availability flag and clears related caches.
 * @access Private
 */
export const updateServiceAvailability = async (
  id: string,
  availability: boolean,
  currentUser: { sub: number; role: string },
) => {
  const item = await serviceAdminRepository.getServiceEntity(id);
  if (!item)
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SERVICE.NOT_FOUND);
   // Ownership Check
   if (
    currentUser.role === UserRole.SERVICE_PARTNER &&
    item.createdBy !== currentUser.sub
  ) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.AUTH.FORBIDDEN_ROLE);
  }
  await serviceAdminRepository.updateService(item, { availability });
  clearLandingHomeCache();
  clearServiceAdminCache();
  return item;
};

/**
 * @name deleteService
 * @description Deletes a service and associated Cloudinary images (when present) and clears related caches.
 * @access Private
 */
export const deleteService = async (
  id: string,
  currentUser: { sub: number; role: string },
) => {
  const item = await serviceAdminRepository.getServiceEntity(id);
  if (!item)
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.SERVICE.NOT_FOUND);

   // Ownership Check
   if (
    currentUser.role === UserRole.SERVICE_PARTNER &&
    item.createdBy !== currentUser.sub
  ) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.AUTH.FORBIDDEN_ROLE);
  }
  for (const publicId of item.cloudinaryIds ?? []) {
    try {
      await deleteImage(publicId);
    } catch {
      // ignore
    }
  }
  await serviceAdminRepository.deleteService(item);
  clearLandingHomeCache();
  clearServiceAdminCache();
};
