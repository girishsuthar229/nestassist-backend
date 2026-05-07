import { ProfileUpdateType, CustomerProfileUpdateType } from "@/enums/servicePartner.enum";
import { UserRole } from "@/enums/userRole.enum";
import * as servicePartnerRepository from "../repositories/servicePartner.repository";
import * as addressRepository from "../repositories/address.repository";
import { STATUS_CODE } from "@/enums";
import { ApiError } from "@/utils/apiError.util";
import { MESSAGES } from "@/constants/messages";
import {
  ProfileResponse,
  UpdateMyProfilePayload,
} from "@/interfaces/servicePartner.interface";
import {
  CLOUDINARY_FOLDERS,
  getCloudinaryThumbnail,
  uploadImage,
} from "@/utils/cloudinary.util";
import { BCRYPT_SALT_ROUNDS } from "@/constants";
import bcrypt from "bcrypt";
import { Transaction } from "sequelize";
import sequelize from "@/configs/db";

/**
 * @name getMyProfile
 * @description
 * Fetch logged-in service partner profile details.
 * @access Private
 */
export const getMyProfile = async (
  userId: number,
  role: string
): Promise<ProfileResponse> => {
  const user = await servicePartnerRepository.findUserById(userId);
  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.NOT_FOUND);
  }

  const baseProfile = {
    id: user.id,
    name: user.name,
    country_code: user.countryCode ?? "",
    mobile_number: user.mobileNumber ?? "",
    email: user.email ?? "",
    role: user.role?.name ?? "",
    profile_image: {
      url: user.profileImage ?? null,
      thumbnail: user.profileImage
        ? getCloudinaryThumbnail(user.profileImage)
        : null,
      public_id: user.cloudinaryId ?? null,
    },
    is_super_admin: user?.role?.name === UserRole.SUPER_ADMIN,
  };

  if (role === UserRole.CUSTOMER) {
    const addresses = await addressRepository.findAddressesByUserId(userId);
    return {
      ...baseProfile,
      is_active: user?.isActive,
      addresses: addresses.map((addr: any) => ({
        id: addr.id,
        label: addr.label,
        custom_label: addr.customLabel,
        display_label: addr.label === "Others" ? addr.customLabel : addr.label,
        house_flat_number: addr.houseFlatNumber,
        landmark: addr.landmark,
        address: addr.address,
        latitude: parseFloat(addr.latitude),
        longitude: parseFloat(addr.longitude),
        full_address: `${addr.houseFlatNumber}, ${addr.landmark ? addr.landmark + ", " : ""}${addr.address}`,
      })),
    };
  }
  if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role as UserRole)) {
    return {
      ...baseProfile,
      profile_address: user.profileAddress ?? "",
    };
  }
  const partner =
    await servicePartnerRepository.findServicePartnerProfileByUserId(userId);
  if (!partner) {
    throw new ApiError(
      STATUS_CODE.NOT_FOUND,
      MESSAGES.EXPERT.NOT_FOUND_PARTNER
    );
  }
  return {
    ...baseProfile,
    permanent_address: partner.permanentAddress ?? "",
    residential_address: partner.residentialAddress ?? "",
    servicetypes: (partner?.dataValues?.serviceTypes || []).map(
      (serviceType: any) => ({
        id: serviceType.id,
        name: serviceType.name,
      })
    ),
    categories: (partner?.dataValues?.skills || [])
      .filter((s: any) => s?.category)
      .map((s: any) => ({
        id: s.category.id,
        name: s.category.name,
      })),
    subcategories: (partner?.dataValues?.services || [])
      .filter((s: any) => s?.subCategory)
      .map((s: any) => ({
        id: s.subCategory.id,
        name: s.subCategory.name,
      })),
  };
};

/**
 * @name updateMyProfile
 * @description
 * Updates logged-in service partner profile based on update type:
 * contact, password, or avatar image.
 * @access Private
 */
export const updateMyProfile = async (
  userId: number,
  userRole: string,
  payload: UpdateMyProfilePayload,
  profileImageFile?: Express.Multer.File
) => {
  const t: Transaction = await sequelize.transaction();

  try {
    const user = await servicePartnerRepository.findUserById(userId, t);
    if (!user) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.USER.NOT_FOUND);
    }
    let servicePartner = null;
    if (userRole === UserRole.SERVICE_PARTNER) {
      servicePartner =
        await servicePartnerRepository.findServicePartnerProfileByUserId(
          userId,
          t
        );
      if (!servicePartner) {
        throw new ApiError(
          STATUS_CODE.NOT_FOUND,
          MESSAGES.EXPERT.NOT_FOUND_PARTNER
        );
      }
    }

    switch (payload.type) {
      case ProfileUpdateType.CONTACT: {
        user.mobileNumber = payload.mobile;
        user.email = payload.email;
        if (
          user &&
          (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN)
        ) {
          user.profileAddress = payload.profile_address ?? "";
        }
        if (servicePartner && userRole === UserRole.SERVICE_PARTNER) {
          servicePartner.permanentAddress = payload.permanent_address ?? "";
          servicePartner.residentialAddress = payload.residential_address ?? "";
          await servicePartner.save({ transaction: t });
        }
        await user.save({ transaction: t });
        break;
      }
      case ProfileUpdateType.PASSWORD: {
        const isMatch = await bcrypt.compare(
          payload.current_password,
          user.password
        );

        if (!isMatch) {
          throw new ApiError(
            STATUS_CODE.BAD_REQUEST,
            MESSAGES.SERVICE_PARTNER.INVALID_CURRENT_PASSWORD
          );
        }

        const isSameAsOld = await bcrypt.compare(
          payload.password,
          user.password
        );

        if (isSameAsOld) {
          throw new ApiError(
            STATUS_CODE.BAD_REQUEST,
            MESSAGES.SERVICE_PARTNER.NEW_PASSWORD_SAME_AS_OLD
          );
        }

        if (payload.password !== payload.password_confirmation) {
          throw new ApiError(
            STATUS_CODE.BAD_REQUEST,
            MESSAGES.SERVICE_PARTNER.PASSWORD_MISMATCH
          );
        }

        const hashedPassword = await bcrypt.hash(
          payload.password,
          BCRYPT_SALT_ROUNDS
        );

        user.password = hashedPassword;
        await user.save({ transaction: t });

        break;
      }
      case ProfileUpdateType.IMAGE: {
        if (!profileImageFile) {
          throw new ApiError(
            STATUS_CODE.BAD_REQUEST,
            MESSAGES.SERVICE_PARTNER.PROFILE_IMG_REQUIRED
          );
        }
        const result = await uploadImage(
          profileImageFile,
          `${
            userRole === UserRole.SERVICE_PARTNER
              ? CLOUDINARY_FOLDERS.SERVICE_PARTNER
              : CLOUDINARY_FOLDERS.ADMIN
          }/profile_images`
        );
        user.profileImage = result.url;
        user.cloudinaryId = result.publicId;

        await user.save({ transaction: t });

        break;
      }
      case ProfileUpdateType.SERVICES: {
        if (!servicePartner) {
          throw new ApiError(
            STATUS_CODE.NOT_FOUND,
            MESSAGES.EXPERT.NOT_FOUND_PARTNER
          );
        }
        const pendingCount = await servicePartnerRepository.hasPendingServices(
          servicePartner.id,
          t
        );

        if (pendingCount > 0) {
          throw new ApiError(
            STATUS_CODE.BAD_REQUEST,
            "You have pending service requests. Please complete or cancel them before updating services."
          );
        }
        const categories = (payload.categories ?? []).map(Number);
        const subcategories = (payload.subcategories ?? []).map(Number);
        const servicetypes = (payload.servicetypes ?? []).map(Number);

        // 1. Categories (skills)
        if (categories.length) {
          await servicePartnerRepository.syncServicePartnerSkills(
            servicePartner.id,
            categories,
            t
          );
        }
        // 2. Subcategories (direct mapping table)
        if (subcategories.length) {
          await servicePartnerRepository.syncServicePartnerSubcategories(
            servicePartner.id,
            subcategories,
            t
          );
        }
        // 3. Service types (JSON / column field)
        if (servicetypes.length) {
          servicePartner.serviceTypeIds = servicetypes;
          await servicePartner.save({ transaction: t });
        }

        break;
      }
      default:
        throw new ApiError(
          STATUS_CODE.BAD_REQUEST,
          MESSAGES.SERVICE_PARTNER.INVALID_UPDATE_TYPE
        );
    }
    const result: ProfileResponse = {
      id: user.id,
      name: user.name,
      country_code: user.countryCode ?? "",
      mobile_number: user.mobileNumber,
      email: user.email,
      role: userRole || "",
      profile_image: {
        url: user.profileImage || null,
        thumbnail: user.profileImage
          ? getCloudinaryThumbnail(user.profileImage)
          : null,
        public_id: user.cloudinaryId || null,
      },
      is_super_admin: user?.role?.name === UserRole.SUPER_ADMIN,
      ...(userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN
        ? {
            profile_address: user.profileAddress ?? "",
          }
        : {}),
      ...(userRole === UserRole.SERVICE_PARTNER && servicePartner
        ? {
            permanent_address: servicePartner.permanentAddress ?? "",
            residential_address: servicePartner.residentialAddress ?? "",
            servicetypes: (servicePartner?.dataValues?.serviceTypes || []).map(
              (serviceType: any) => ({
                id: serviceType.id,
                name: serviceType.name,
              })
            ),
            categories: (servicePartner?.dataValues?.skills || [])
              .filter((s: any) => s?.category)
              .map((s: any) => ({
                id: s.category.id,
                name: s.category.name,
              })),
            subcategories: (servicePartner?.dataValues?.services || [])
              .filter((s: any) => s?.subCategory)
              .map((s: any) => ({
                id: s.subCategory.id,
                name: s.subCategory.name,
              })),
          }
        : {}),
    };
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
