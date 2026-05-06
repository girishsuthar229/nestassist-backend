import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import * as AuthRepository from "../repositories/auth.repository";
import { ApiError } from "../utils/apiError.util";
import { UserRole } from "@/enums/userRole.enum";
import { sendForgotPasswordEmailDirect } from "../utils/mail.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { LoginPayload, ResetPasswordPayload, DecodedToken } from "@/interfaces/auth.interface";
import { DEFAULT_JWT_EXPIRY, BCRYPT_SALT_ROUNDS } from "@/constants";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRY = process.env.JWT_EXPIRY || DEFAULT_JWT_EXPIRY;

/**
 * @name loginUser
 * @description
 * Authenticate service partner or admin users and return a JWT token.
 * Only active service partners, admins, and super admins can log in through this route.
 * @access Public
 */
export const loginUser = async (payload: LoginPayload) => {
  const { email, password } = payload;

  // 1. Find User
  const user = await AuthRepository.findUserByEmailWithRole(email);

  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  const roleName = user.role?.name;

  // 2. Check Role (Only Service Partners, Admins, Super Admins can login through this route)
  const allowedRoles = [UserRole.SERVICE_PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
  if (!allowedRoles.includes(roleName as UserRole)) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.AUTH.ACCESS_DENIED_NOT_PARTNER);
  }

  // 3. Check if Active
  if (!user.isActive) {
    throw new ApiError(
      STATUS_CODE.FORBIDDEN,
      MESSAGES.AUTH.ACCOUNT_NOT_ACTIVATED
    );
  }

  // 4. Check Password
  if (!user.password) {
    throw new ApiError(
      STATUS_CODE.BAD_REQUEST,
      MESSAGES.AUTH.PASSWORD_NOT_SET
    );
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new ApiError(STATUS_CODE.UNAUTHORIZED, MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  // 5. Generate Token
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: roleName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY as SignOptions['expiresIn'] }
  );

  return {
    id: user.id,
    role: roleName,
    token,
    token_type: "Bearer",
    expires_in: JWT_EXPIRY,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleName,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
    }
  };
};

/** 
 * @name requestPasswordReset
 * @description
 * Initiate password reset process for service partners by generating a reset token and sending an email.
 * Only service partners can request password resets through this route.
 * @access Private
 */
export const requestPasswordReset = async (email: string) => {
  const user = await AuthRepository.findUserByEmailWithRole(email);

  if (!user) {
    throw new ApiError(STATUS_CODE.NOT_FOUND, MESSAGES.AUTH.INVALID_CREDENTIALS);
  }
  const roleName = user.role?.name;
  const allowedRoles = [UserRole.SERVICE_PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
  if (!allowedRoles.includes(roleName as UserRole)) {
    throw new ApiError(
      STATUS_CODE.FORBIDDEN,
      MESSAGES.AUTH.PASSWORD_RESET_ONLY_FOR_PARTNERS
    );
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(STATUS_CODE.FORBIDDEN, MESSAGES.AUTH.ACCOUNT_NOT_ACTIVATED);
  }

  // Generate a JWT for password reset that expires in 24 hours
  const resetToken = jwt.sign(
    { sub: user.id, email: user.email, role: roleName, type: "password_reset" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY as SignOptions['expiresIn'] }
  );

  user.rememberToken = resetToken;
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL}/partner/reset-password?token=${resetToken}`;
  await sendForgotPasswordEmailDirect(user.email, user.name, resetLink);

  return { email };
};

/**
 * @name resetPasswordPartner
 * @description
 * Reset the password for a service partner using the provided reset token and new password.
 * The reset token is validated against the JWT secret and must match the token stored in the database for the user.
 * This ensures that the token is valid, has not expired, and has not been used before.
 * Admins, super admins, and service partners can reset their passwords using this.
 * @access Public
 */
export const resetPasswordUser = async (payload: ResetPasswordPayload) => {
  const { token, newPassword } = payload;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as DecodedToken;

    if (decoded.type !== "password_reset") {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.AUTH.INVALID_RESET_TOKEN_TYPE);
    }

    const user = await AuthRepository.findUserByResetToken(decoded.sub, token);

    if (!user) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.AUTH.PASSWORD_RESET_LINK_EXPIRED);
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Set to null to clear in DB
    user.set("rememberToken", null);

    await user.save();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.AUTH.PASSWORD_RESET_EXPIRED);
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(STATUS_CODE.BAD_REQUEST, MESSAGES.AUTH.INVALID_RESET_TOKEN);
  }

  return true;
};

/**
 * @name logout
 * @description
 * Log out a user by clearing their remember token in the database.
 * This effectively invalidates any existing sessions or tokens associated with that user.
 * @access Private
 */
export const logout = async (userId: number) => {
  const user = await AuthRepository.findUserById(userId);
  if (user) {
    user.set("rememberToken", null);
    await user.save();
  }
  return true;
};
