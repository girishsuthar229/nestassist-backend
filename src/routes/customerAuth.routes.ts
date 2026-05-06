import { Router } from "express";
import * as CustomerAuthController from "../controllers/customerAuth.controller";
import { validate } from "../middlewares/validate.middleware";
import { verifyCustomerJWT } from "../middlewares/customerAuth.middleware";
import {
  sendOtpValidation,
  verifyOtpValidation,
  resendOtpValidation,
} from "../validations/customerAuth.validation";

const router = Router();

/**
 * Customer Authentication Routes
 * Base: /api/v1/customer
 */

// ── Public routes ────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Customer Auth
 *   description: Customer registration and authentication via OTP.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SendOtpPayload:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *     VerifyOtpPayload:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *       properties:
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         otp:
 *           type: string
 *           example: "123456"
 *     CustomerResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         is_verified:
 *           type: boolean
 */

// ── Public routes ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/customer/send-otp:
 *   post:
 *     summary: Send OTP to customer email
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendOtpPayload'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       429:
 *         description: Too many attempts
 */
router.post(
  "/send-otp",
  validate(sendOtpValidation),
  CustomerAuthController.sendOtp
);

/**
 * @swagger
 * /api/v1/customer/verify-otp:
 *   post:
 *     summary: Verify OTP and login/register
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpPayload'
 *     responses:
 *       200:
 *         description: OTP verified and token returned
 */
router.post(
  "/verify-otp",
  validate(verifyOtpValidation),
  CustomerAuthController.verifyOtp
);

/**
 * @swagger
 * /api/v1/customer/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 */
router.post(
  "/resend-otp",
  validate(resendOtpValidation),
  CustomerAuthController.resendOtp
);

/**
 * @swagger
 * /api/v1/customer/logout:
 *   post:
 *     summary: Logout customer
 *     tags: [Customer Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", CustomerAuthController.logout);

// ── Protected routes ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/customer/customer-info:
 *   get:
 *     summary: Get current customer info
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 */
router.get("/customer-info", verifyCustomerJWT, CustomerAuthController.me);

export default router;
