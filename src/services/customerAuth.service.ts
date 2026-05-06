import { Op } from "sequelize";
import User from "../models/user.model";
import CustomerOtp from "../models/customerOtp.model";
import {
  generateOtp,
  getOtpExpiry,
  parseDbTimestampAsUTC,
} from "../utils/otp.util";
import { sendOtpEmail } from "./email.service";
import { generateToken, getExpiresIn } from "./token.service";
import { ApiError } from "../utils/apiError.util";
import logger from "../utils/logger";
import { CustomerUserData, ResendOtpInput, SendOtpInput, SendOtpResult, VerifyOtpInput, VerifyOtpResult } from "@/interfaces/customer.interface";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import * as AuthRepository from "../repositories/auth.repository";
import { UserRole } from "@/enums/userRole.enum";

// ─────────────────────────────────────────────
// 0) Rate Limit Helper
// ─────────────────────────────────────────────

/**
 * Checks if the number of OTP requests for an email exceeds the limit (max 2 in 2 mins).
 */
const checkOtpRateLimit = async (email: string): Promise<void> => {
  const twoMinutesAgo = new Date(Date.now() - 120000); // 120,000 ms = 2 minutes

  const count = await CustomerOtp.count({
    where: {
      email,
      createdAt: { [Op.gte]: twoMinutesAgo },
    },
  });

  if (count >= 2) {
    logger.warn(`CustomerAuthService: Rate limit exceeded for ${email}`);
    throw new ApiError(
      STATUS_CODE.TOO_MANY_REQUESTS,
      MESSAGES.CUSTOMER.OTP_RATE_LIMIT
    );
  }
};

// ─────────────────────────────────────────────
// 1) Send OTP
// ─────────────────────────────────────────────

export const sendOtp = async (input: SendOtpInput): Promise<SendOtpResult> => {
  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();

  // Check rate limit (max 2 per 2 mins)
  await checkOtpRateLimit(email);

  const otp = generateOtp();
  const expires_at = getOtpExpiry(10);

  // Partial cleanup: delete only records older than 10 minutes to keep history for rate limit
  const tenMinutesAgo = new Date(Date.now() - 600000);
  await CustomerOtp.destroy({
    where: {
      email,
      createdAt: { [Op.lt]: tenMinutesAgo },
    },
  });

  await CustomerOtp.create({
    email,
    otp,
    expires_at,
    name,
  });

  // Send OTP email (throws if email fails — caught by controller)
  await sendOtpEmail(email, name, otp);

  return { name, email };
};

// ─────────────────────────────────────────────
// 2) Verify OTP
// ─────────────────────────────────────────────

export const verifyOtp = async (
  input: VerifyOtpInput,
): Promise<VerifyOtpResult> => {
  const email = input.email.toLowerCase().trim();
  const otp = input.otp.trim();

  const otpRecord = await CustomerOtp.findOne({
    where: { email },
    order: [["createdAt", "DESC"]],
  });

  if (!otpRecord) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CUSTOMER.OTP_NOT_FOUND);
  }

  // IMPORTANT: Parse DB timestamp as UTC-naive
  const expiresAt = parseDbTimestampAsUTC(otpRecord.expires_at);
  const now = Date.now();

  // 1) Expiry check first
  if (!otpRecord.expires_at || Number.isNaN(expiresAt) || now > expiresAt) {
    await CustomerOtp.destroy({ where: { email } });
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CUSTOMER.OTP_EXPIRED);
  }

  // 2) OTP match check
  if (otpRecord.otp !== otp) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CUSTOMER.OTP_INCORRECT);
  }

  let user = await AuthRepository.findUserByEmail(email);

  if (user) {
    if (user.name !== otpRecord.name) {
      await user.update({
        name: otpRecord.name,
        emailVerifiedAt: new Date(),
      });
    } else if (!user.emailVerifiedAt) {
      await user.update({ emailVerifiedAt: new Date() });
    }

    logger.info(`CustomerAuthService: Existing user logged in — ${email}`);
  } else {
    user = await User.create({
      name: otpRecord.name,
      email,
      roleId: 3,
      isActive: true,
      emailVerifiedAt: new Date(),
      password: "",
      mobileNumber: "",
    });

    logger.info(`CustomerAuthService: New customer registered — ${email}`);
  }

  // 3) Full cleanup — delete all OTP entries for this email on successful verification
  await CustomerOtp.destroy({ where: { email } });

  const token = generateToken({ sub: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      is_verified: !!user.emailVerifiedAt,
      role: UserRole.CUSTOMER
    },
    token,
    token_type: "Bearer",
    expires_in: getExpiresIn(),
  };
};

// ─────────────────────────────────────────────
// 3) Resend OTP
// ─────────────────────────────────────────────

export const resendOtp = async (
  input: ResendOtpInput,
): Promise<SendOtpResult> => {
  const email = input.email.toLowerCase().trim();

  // Check rate limit (max 2 per 2 mins)
  await checkOtpRateLimit(email);

  const existingOtp = await CustomerOtp.findOne({
    where: { email },
    order: [["createdAt", "DESC"]],
  });

  if (!existingOtp) {
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.CUSTOMER.OTP_SESSION_NOT_FOUND);
  }

  const name = existingOtp.name;
  const otp = generateOtp();
  const expires_at = getOtpExpiry(10);

  // Partial cleanup: delete only records older than 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 600000);
  await CustomerOtp.destroy({
    where: {
      email,
      createdAt: { [Op.lt]: tenMinutesAgo },
    },
  });

  await CustomerOtp.create({
    email,
    otp,
    expires_at,
    name,
  });

  await sendOtpEmail(email, name, otp);

  return { name, email };
};

export const logout = async (userId?: number): Promise<void> => {
  logger.info(`CustomerAuthService: Logout requested for userId=${userId ?? "unknown"}`);
}

// ─────────────────────────────────────────────
// 4) Get current customer by ID (for /me route)
// ─────────────────────────────────────────────

export const getCustomerById = async (
  id: number,
): Promise<CustomerUserData> => {
  const user = await AuthRepository.findCustomerById(id);

  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.CUSTOMER.NOT_FOUND);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    is_verified: !!user.emailVerifiedAt,
    role: user.role?.name || null,
  };
};
