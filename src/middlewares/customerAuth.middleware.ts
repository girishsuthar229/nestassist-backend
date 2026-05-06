import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.util";
import logger from "../utils/logger";
import { STATUS_CODE } from "@/enums";
import { MESSAGES } from "@/constants/messages";
import { CustomerJwtPayload } from "@/interfaces/auth.interface";


// Extend Express Request globally for customer context
declare global {
  namespace Express {
    interface Request {
      customer?: CustomerJwtPayload;
    }
  }
}

/**
 * Middleware to verify customer JWT tokens.
 * Used on protected customer routes (e.g. /me, address, bookings).
 */
export const verifyCustomerJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader =
      req.headers.authorization ?? (req.headers["Authorization"] as string | undefined);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("CustomerAuth: Missing or malformed Authorization header");
      throw new ApiError(STATUS_CODE.UNAUTHORIZED, MESSAGES.AUTH.UNAUTHORIZED);
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      logger.error("CustomerAuth: JWT_SECRET is not defined");
      throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, MESSAGES.AUTH.JWT_SECRET_MISSING);
    }

    const decoded = jwt.verify(token, secret) as unknown as CustomerJwtPayload;
    req.customer = decoded;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }
    logger.warn(`CustomerAuth: Token verification failed`);
    next(new ApiError(STATUS_CODE.UNAUTHORIZED, MESSAGES.AUTH.INVALID_OR_EXPIRED_TOKEN));
  }
};
