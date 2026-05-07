import { Request, Response, NextFunction } from "express";
import * as profileService from "@/services/customerProfile.service";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import logger from "@/utils/logger";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * @name changeMobile
 * @description Controller to update customer mobile number
 * @access Private
 */
export const changeMobile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const { mobile_number } = req.body;
    const result = await profileService.changeMobile(Number(userId), mobile_number);

    return sendResponse(res, MESSAGES.USER.MOBILE_UPDATE, result);
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * @name changeEmail
 * @description Controller to initiate email update (sends OTP)
 * @access Private
 */
export const changeEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const { email } = req.body;
    const result = await profileService.changeEmail(Number(userId), email);

    return sendResponse(res, MESSAGES.AUTH.OTP_SENT, result);
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * @name verifyEmailUpdate
 * @description Controller to verify OTP and update user email
 * @access Private
 */
export const verifyEmailUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const { email, otp } = req.body;
    const result = await profileService.verifyEmailUpdate(
      Number(userId),
      email,
      otp
    );

    return sendResponse(res, MESSAGES.USER.EMAIL_UPDATE, result);
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * @name saveAddress
 * @description Controller to create or update a customer address
 * @access Private
 */
export const saveAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const { address } = req.body;
    const result = await profileService.saveAddress(Number(userId), address);

    return sendResponse(res, MESSAGES.USER.ADDRESS_CREATED, result);
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};/**
 * @name getUserAddresses
 * @description Controller to fetch customer addresses
 * @access Private
 */
export const getUserAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const result = await profileService.getUserAddresses(Number(userId));
    return sendResponse(res, MESSAGES.USER.ADDRESS_FETCHED, result);
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * @name deleteAddress
 * @description Controller to delete a customer address
 * @access Private
 */
export const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;
    const result = await profileService.deleteAddress(Number(userId), Number(id));
    return sendResponse(res, MESSAGES.USER.ADDRESS_DELETED, result);
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * @name getAddressById
 * @description Controller to fetch a single customer address
 * @access Private
 */
export const getAddressById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;
    const result = await profileService.getAddressById(Number(userId), Number(id));
    return sendResponse(res, MESSAGES.USER.ADDRESS_FETCHED, result);
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * @name getRecentSearches
 * @description Controller to fetch recent searches for a customer
 * @access Private
 */
export const getRecentSearches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const result = await profileService.getRecentSearches(Number(userId));
    return sendResponse(res, MESSAGES.USER.RECENT_SEARCH_FETCHED, result);
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};

/**
 * @name saveRecentSearch
 * @description Controller to save a new recent search for a customer
 * @access Private
 */
export const saveRecentSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.sub;
    const searchData = req.body;
    const result = await profileService.saveRecentSearch(Number(userId), searchData);
    return sendResponse(res, MESSAGES.USER.RECENT_SEARCH_SAVED, result);
  } catch (err) {
    logger.error(getErrorMessage(err));
    next(err);
  }
};
