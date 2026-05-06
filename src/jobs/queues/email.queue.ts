import { Queue } from "bullmq";
import { redisConnection } from "../../configs/redis.config";
import logger from "@/utils/logger";

/**
 * BullMQ Queue for handling email jobs.
 */
export const emailQueue = new Queue("emailQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  }
});

/**
 * @name addEmailJob
 * @description
 * Adds a new email job to the queue with specified name and data.
 * Includes retry logic with exponential backoff for failed jobs.
 * @access Private
 */
export const addEmailJob = async (name: string, data: any) => {
  try {
    logger.info(`[Queue] Adding email job to queue (Type: ${name})`);
    await emailQueue.add(name, data, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
  } catch (err: unknown) {
    logger.error(
      `[Queue] Failed to add email job to queue (Type: ${name}):`,
      err
    );
    throw err;
  }
};
