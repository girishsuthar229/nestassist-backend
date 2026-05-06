import express from "express";
import { razorpayWebhookHandler } from "../controllers/razorpayWebhook.controller";

const router = express.Router();

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhookHandler
);

export default router;
