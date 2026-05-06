import { Request, Response } from "express";
import { handleRazorpayEvent } from "@/services/razorpayWebhook.service";
import Razorpay from "razorpay";
import logger from "@/utils/logger";
import dotenv from "dotenv";
import { sendError, sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
import { getErrorMessage } from "@/utils/common.utils";

dotenv.config();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

/**
 * @name razorpayWebhookHandler
 * @description
 * Express route handler for Razorpay webhooks. Validates the webhook signature and processes the event payload.
 * Handles events such as payment captured, payment failed, and order expiration to update booking and payment records accordingly.
 * @access Private
 */
export const razorpayWebhookHandler = async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;

  if (!RAZORPAY_WEBHOOK_SECRET) {
    logger.error("RAZORPAY_WEBHOOK_SECRET is missing");
    return sendError(res, MESSAGES.COMMON.CONFIG_ERROR, STATUS_CODE.INTERNAL_SERVER_ERROR);
  }

  const rawBody = req.body.toString();
  const isValid = Razorpay.validateWebhookSignature(
    rawBody,
    signature,
    RAZORPAY_WEBHOOK_SECRET
  );

  if (!isValid) {
    logger.warn("Invalid Razorpay webhook signature");
    return sendError(res, MESSAGES.PAYMENT.INVALID_SIGNATURE, STATUS_CODE.BAD_REQUEST);
  }

  try {
    const payload = JSON.parse(rawBody);
    await handleRazorpayEvent(payload);
    return sendResponse(res, { status: "ok" });
  } catch (error: unknown) {
    logger.error(`Razorpay Webhook Processing Error: ${getErrorMessage(error)}`);
    return sendError(res, MESSAGES.COMMON.SERVER_ERROR, STATUS_CODE.INTERNAL_SERVER_ERROR);
  }
};
