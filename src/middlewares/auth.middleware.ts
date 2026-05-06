import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.util";
import logger from "../utils/logger";
import User from "@/models/user.model";
import { UserRole } from "@/enums/userRole.enum";
import { sendError } from "@/utils/response.util";
import Role from "@/models/role.model";
import { STATUS_CODE } from "@/enums";
import { MESSAGES } from "@/constants/messages";
import { AUTH } from "@/constants/messages/auth.messages";
import { TokenPayload } from "@/interfaces/auth.interface";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.toString().startsWith("Bearer ")) {
      logger.warn("Unauthorized request: Missing or invalid token format");
      return next(new ApiError(STATUS_CODE.UNAUTHORIZED, AUTH.TOKEN_MISSING_BEARER_FORMAT));
    }

    const token = authHeader.toString().split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      logger.error("JWT_SECRET is not defined in environment variables");
      return next(new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, AUTH.JWT_SECRET_MISSING));
    }

    jwt.verify(
      token,
      secret,
      { algorithms: ["HS256"] },
      (err, decoded) => {
        if (err) {
          logger.warn(`Token verification failed: ${err.message}`);
          return next(
            new ApiError(STATUS_CODE.FORBIDDEN, AUTH.FORBIDDEN)
          );
        }

        req.user = decoded as TokenPayload;
        next();
      }
    );
  } catch (error) {
    next(error);
  }
};

export async function checkActiveUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Verify user ID claim
    const userId = req.user?.id || req.user?.sub;
    
    if (!userId) {
      return sendError(res, MESSAGES.AUTH.INVALID_TOKEN_MISSING_USER_ID, STATUS_CODE.UNAUTHORIZED);
    }

    // 2. Single DB call against the unified `users` table, pulling the Role definition too
    const userRecord = await User.findByPk(userId, {
      attributes: ['id', 'isActive', 'roleId'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name']
        }
      ],
    });

    if (!userRecord) {
      return sendError(res, MESSAGES.USER.NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }

    // 3. Status checks
    if (userRecord.isActive === false) {
      return sendError(res, MESSAGES.AUTH.ACCOUNT_INACTIVE_CONTACT_SUPPORT, STATUS_CODE.FORBIDDEN);
    }

    // 4. Attach role explicitly derived from the Role mapping
    req.user.role = (userRecord as any).role?.name || UserRole.CUSTOMER;

    next();
  } catch (error) {
    logger.error('checkActiveUser error:', error);
    return sendError(res, MESSAGES.COMMON.INTERNAL_SERVER_ERROR, STATUS_CODE.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Middleware to authorize specific roles.
 * Must be used after verifyJWT and checkActiveUser.
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          STATUS_CODE.FORBIDDEN,
          MESSAGES.AUTH.FORBIDDEN_ROLE
        )
      );
    }
    next();
  };
};

/**
 * Optional JWT verification.
 * Does not throw error if token is missing or invalid.
 */
export const optionalVerifyJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.toString().startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.toString().split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret || !token) {
      return next();
    }

    jwt.verify(
      token,
      secret,
      { algorithms: ["HS256"] },
      (err, decoded) => {
        if (!err) {
          req.user = decoded as TokenPayload;
        }
        next();
      }
    );
  } catch (error) {
    next();
  }
};

/**
 * Optional check for active user.
 * If req.user exists, populates role and verifies status.
 */
export async function optionalCheckActiveUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) return next();

  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return next();

    const userRecord = await User.findByPk(userId, {
      attributes: ['id', 'isActive', 'roleId'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name']
        }
      ],
    });

    if (userRecord && userRecord.isActive !== false) {
      req.user.role = (userRecord as any).role?.name || UserRole.CUSTOMER;
    } else {
      delete req.user;
    }
    next();
  } catch (error) {
    delete req.user;
    next();
  }
}

