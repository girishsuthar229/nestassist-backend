import { Worker, Job } from "bullmq";
import { redisConnection } from "../../configs/redis.config";
import * as mailUtils from "../../utils/mail.util";
import logger from "../../utils/logger";
import { EMAIL_WORKER } from "@/enums/email.enum";

/**
 * @name emailWorker
 * @description
 * BullMQ Worker for processing email jobs.
 * Handles different types of email jobs such as sending admin credentials, partner approval emails, and forgot password emails.
 * Listens for job completion and failure events to log the outcomes.
 * @access Private
 */
const emailWorker = new Worker(
  "emailQueue",
  async (job: Job) => {
    const { name, data } = job;
    logger.info(`[Worker] Started processing job ${job.id} (Type: ${name})`);

    try {
      switch (name) {
        case EMAIL_WORKER.SEND_ADMIN_CREDENTIALS:
          await mailUtils.sendAdminCredentialsDirect(data.email, data.name, data.password);
          break;
        case EMAIL_WORKER.SEND_PARTNER_APPROVAL:
          await mailUtils.sendPartnerApprovalEmailDirect(data.email, data.name, data.resetLink);
          break;
        case EMAIL_WORKER.SEND_PARTNER_REJECTION:
          await mailUtils.sendPartnerRejectionEmailDirect(data.email, data.name);
          break;
        case EMAIL_WORKER.SEND_FORGOT_PASSWORD:
          await mailUtils.sendForgotPasswordEmailDirect(data.email, data.name, data.resetLink);
          break;
        case EMAIL_WORKER.SEND_BOOKING_CONFIRMATION:
          await mailUtils.sendBookingConfirmationEmailDirect(
            data.email,
            data.name,
            data.bookingId,
            data.serviceName,
            data.slot,
            data.amount
          );
          break;
        default:
          logger.warn(`[Worker] Unknown email job type: ${name}`);
      }
    } catch (error) {
      logger.error(`[Worker] Failed to process email job ${job.id}:`, error);
      throw error;
    }
  },
  { connection: redisConnection }
);

emailWorker.on("ready", () => {
  logger.info("[Worker] Email worker is ready and connected to Redis ✅");
});

emailWorker.on("error", (err) => {
  logger.error("[Worker] Email worker critical error:", err);
});

emailWorker.on("completed", (job) => {
  logger.info(`[Worker] Email job ${job.id} completed successfully ✅`);
});

emailWorker.on("failed", (job, err) => {
  logger.error(`[Worker] Email job ${job?.id} failed with error: ${err.message}`);
});

export default emailWorker;
