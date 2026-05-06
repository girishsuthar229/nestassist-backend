import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import logger from "@/utils/logger";
import { sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { getErrorMessage } from "@/utils/common.utils";

/**
 * @name loginUser
 * @description
 * Authenticate service partner or admin users and return a JWT token.
 * Only active users can log in through this route.
 * @access Public
 */
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.loginUser(req.body);

    return sendResponse(res, MESSAGES.AUTH.LOGIN_SUCCESS, result);
  } catch (error: unknown) {
    logger.error(`Login error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * @name forgotPasswordUser
 * @description
 * Initiate the password reset process for users.
 * Generates a password reset token and sends it to the user's email.
 * @access Public
 */
export const forgotPasswordUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const data = await authService.requestPasswordReset(email);

    return sendResponse(res, MESSAGES.AUTH.PASSWORD_RESET_TOKEN_SENT, data);
  } catch (error: unknown) {
    logger.error(`Forgot password error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * @name resetPasswordUser
 * @description
 * Reset the password for a user using the provided reset token and new password.
 * Validates the reset token and updates the user's password if valid.
 * @access Public
 */
export const resetPasswordUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.resetPasswordUser(req.body);

    return sendResponse(res, MESSAGES.AUTH.PASSWORD_RESET_SUCCESS, result);
  } catch (error: unknown) {
    logger.error(`Reset password error: ${getErrorMessage(error)}`);
    next(error);
  }
};

/**
 * @name logoutUser
 * @description
 * Logout a user by invalidating their JWT token.
 * Removes the token from the user's record to prevent further use.
 * @access Private
 */
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    await authService.logout(userId);

    return sendResponse(res, MESSAGES.AUTH.LOGOUT_SUCCESS);
  } catch (error: unknown) {
    logger.error(`Logout error: ${getErrorMessage(error)}`);
    next(error);
  }
};
