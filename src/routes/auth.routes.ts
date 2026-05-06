import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "@/middlewares/validate.middleware";
import {
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "@/validations/auth.validation";
import { verifyJWT } from "@/middlewares/auth.middleware";
import {
  createUserOrIpRateLimiter,
  numberFromEnv,
} from "@/middlewares/rateLimit.middleware";

const router = Router();

/**
 * Auth Routes
 * Base path: /api/auth
 */

// Auth rate limits (mostly unauthenticated; keys fall back to normalized IP).
// You can tune these with env vars:
const authRateLimiter = createUserOrIpRateLimiter("service:auth", {
  windowMs: 60000,
  limit: numberFromEnv("RATE_LIMIT_AUTH_MAX", 10),
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login as an admin or partner
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post(
  "/login",
  authRateLimiter,
  validate(loginValidation),
  authController.loginUser,
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordValidation),
  authController.forgotPasswordUser,
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordValidation),
  authController.resetPasswordUser,
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post(
  "/logout",
  verifyJWT,
  authRateLimiter,
  authController.logoutUser,
);

export default router;
