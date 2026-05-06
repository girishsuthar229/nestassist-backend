import { NextFunction, Request, Response } from "express";
import * as servicePartnerService from "../services/servicePartner.service";
import { uploadImage } from "@/utils/cloudinary.util";
import { CLOUDINARY_FOLDERS } from "../configs/cloudnary";
import { ServicePartnerFilesDto } from "@/dtos/servicePartner.dto";
import logger from "@/utils/logger";
import { ApprovalAction } from "@/enums/servicePartner.enum";
import { sendError, sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * @name register
 * @description
 * Register a new service partner and upload their profile image and documents.
 * @access Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 1. Handle File Uploads to Cloudinary
    const uploadedFiles: ServicePartnerFilesDto = {
      profileImage: [],
      attachments: [],
    };

    if (files && files.profileImage) {
      const profileImg = files.profileImage[0];
      if (!profileImg.mimetype.startsWith("image/")) {
        return sendError(
          res,
          "Profile image must be an image file",
          STATUS_CODE.BAD_REQUEST,
        );
      }

      const result = await uploadImage(
        profileImg,
        `${CLOUDINARY_FOLDERS.SERVICE_PARTNER}/profile_images`,
      );
      uploadedFiles.profileImage!.push({
        path: result.url,
        cloudinaryId: result.publicId,
      });
    }

    if (files && files.attachments) {
      for (const doc of files.attachments) {
        const result = await uploadImage(
          doc,
          `${CLOUDINARY_FOLDERS.SERVICE_PARTNER}/documents`,
        );
        uploadedFiles.attachments!.push({
          path: result.url,
          originalname: doc.originalname,
          size: doc.size.toString(),
          cloudinaryId: result.publicId,
        });
      }
    }

    // 3. Call Service
    const result = await servicePartnerService.registerPartner(
      data,
      uploadedFiles,
    );

    return sendResponse(
      res,
      MESSAGES.AUTH.REGISTER_SUCCESS,
      result,
      STATUS_CODE.CREATED,
    );
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name getAllPartners
 * @description
 * Fetch all service partners with pagination and filtering.
 * @access Private | Admin
 */
export const getAllPartners = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await servicePartnerService.getServicePartners(req.query);

    return sendResponse(res,{
      message:MESSAGES.EXPERT.FETCHED,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name updatePartnerStatus
 * @description
 * Update the active status of a service partner.
 * @access Private | Admin
 */
export const updatePartnerStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await servicePartnerService.updateStatus(Number(id));

    return sendResponse(res, MESSAGES.EXPERT.STATUS_UPDATED, result);
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name deletePartner
 * @description
 * Delete a service partner and their associated data.
 * @access Private | Admin
 */
export const deletePartner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await servicePartnerService.deleteServicePartner(Number(id));

    return sendResponse(res, MESSAGES.EXPERT.DELETED, result);
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name getPartnerById
 * @description
 * Fetch detailed information of a service partner by their ID.
 * @access Private | Admin
 */
export const getPartnerById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await servicePartnerService.getServicePartnerById(
      Number(id),
    );

    return sendResponse(res, MESSAGES.EXPERT.EXPERT_FETCHED, result);
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name approveRejectPartner
 * @description
 * Approve or reject a service partner registration request.
 * @access Private | Admin
 */
export const approveRejectPartner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!Object.values(ApprovalAction).includes(action)) {
      return sendError(
        res,
        `Invalid action. Must be one of: ${Object.values(ApprovalAction).join(", ")}`,
        STATUS_CODE.BAD_REQUEST,
      );
    }

    const result = await servicePartnerService.approveRejectPartner(
      Number(id),
      action,
    );

    return sendResponse(res, MESSAGES.EXPERT.APPROVAL_UPDATED, result);
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};

/**
 * @name getAssignedServices
 * @description
 * Fetch services assigned to a specific service partner.
 * @access Private | Service Partner
 */
export const getAssignedServices = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await servicePartnerService.getAssignedBookings(
      Number(id),
      req.query,
    );

    return sendResponse(res, MESSAGES.BOOKING.FETCHED, result);
  } catch (error: unknown) {
    logger.error(getErrorMessage(error));
    next(error);
  }
};
