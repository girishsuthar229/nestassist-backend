import { handleStripeEvent } from "@/services/stripeWebhook.service";
import { Request, Response } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { sendError, sendResponse } from "@/utils/response.util";
import { MESSAGES } from "@/constants/messages";
import { STATUS_CODE } from "@/enums";
dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
  throw new Error(MESSAGES.PAYMENT.STRIPE_API_KEYS_NOT_SET);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
});

const endpointSecret = STRIPE_WEBHOOK_SECRET;

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  let event: Stripe.Event;

  try {
    const sig = req.headers["stripe-signature"] as string;

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    return sendError(res, `Webhook Error: ${err.message}`, STATUS_CODE.BAD_REQUEST);
  }

  await handleStripeEvent(event);

  return sendResponse(res, { received: true });
};
