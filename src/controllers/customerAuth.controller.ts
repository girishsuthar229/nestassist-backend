import { Request, Response, NextFunction } from "express";
import * as CustomerAuthService from "../services/customerAuth.service";
import { asyncHandler } from "../utils/asyncHandler.util";
import logger from "../utils/logger";
import { sendResponse, sendError } from "../utils/response.util";
import { MESSAGES } from "../constants/messages";
import { STATUS_CODE } from "@/enums";

interface AuthenticatedRequest extends Request {
  customer?: {
    sub: number;
    email: string;
  };
}

// ─────────────────────────────────────────────
// POST /api/v1/customer/send-otp
// ─────────────────────────────────────────────

export const sendOtp = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { name, email } = req.body as { name: string; email: string };

    logger.info(`CustomerAuthController: send-otp requested for ${email}`);

    const data = await CustomerAuthService.sendOtp({ name, email });

    sendResponse(res, MESSAGES.AUTH.OTP_SENT, data);
  }
);

// ─────────────────────────────────────────────
// POST /api/v1/customer/verify-otp
// ─────────────────────────────────────────────

export const verifyOtp = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { email, otp } = req.body as { email: string; otp: string };

    logger.info(`CustomerAuthController: verify-otp requested for ${email}`);

    const data = await CustomerAuthService.verifyOtp({ email, otp });

    sendResponse(res, MESSAGES.AUTH.OTP_VERIFIED, data);
  }
);

// ─────────────────────────────────────────────
// POST /api/v1/customer/resend-otp
// ─────────────────────────────────────────────

export const resendOtp = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { email } = req.body as { email: string };

    logger.info(`CustomerAuthController: resend-otp requested for ${email}`);

    const data = await CustomerAuthService.resendOtp({ email });

    sendResponse(res, MESSAGES.AUTH.OTP_RESENT, data);
  }
);

// ─────────────────────────────────────────────
// POST /api/v1/customer/logout
// ─────────────────────────────────────────────

export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const customerId = req.customer?.sub;
    await CustomerAuthService.logout(customerId);
    sendResponse(res, MESSAGES.AUTH.LOGOUT_SUCCESS_ALT, []);
  }
);

// ─────────────────────────────────────────────
// GET /api/v1/customer/customer-info  (protected)
// ─────────────────────────────────────────────

export const me = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const customerId = req.customer?.sub;

    if (!customerId) {
      sendError(res, MESSAGES.COMMON.UNAUTHORIZED, STATUS_CODE.UNAUTHORIZED);
      return;
    }

    logger.info(`CustomerAuthController: /me requested for customer ${customerId}`);

    const user = await CustomerAuthService.getCustomerById(customerId);

    sendResponse(res, MESSAGES.CUSTOMER.PROFILE_FETCHED, { user });
  }
);
