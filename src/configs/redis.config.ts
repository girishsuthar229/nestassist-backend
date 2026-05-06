import { createClient } from "redis";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const redisPort = process.env.REDIS_PORT || 18666;

if (!redisUrl) {
  throw new Error(
    "REDIS_URL is missing in environment variables. Please check your .env file."
  );
}

/**
 * BullMQ Connection options
 */
export const redisConnection = {
  host: process.env.REDIS_URL,
  port: Number(redisPort),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,    // Faster and uses fewer commands during connection
};

/**
 * Redis Client for general app usage (Node-Redis)
 */
export const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_URL,
    port: Number(redisPort),
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error("Redis reconnection failed after 10 attempts.");
        return new Error("Redis reconnection failed");
      }
      return Math.min(retries * 500, 5000);
    },
  },
});

redisClient.on("error", (err) => {
  if (err.message.includes("max number of clients reached")) {
    logger.error("CRITICAL: Redis connection limit reached on Redis Cloud! Please check active connections.");
  } else {
    logger.error("Redis Client Error: ", err);
  }
});

redisClient.on("connect", () => {
  logger.info("Redis Client Connecting to Redis Cloud...");
});

redisClient.on("ready", () => {
  logger.info("Redis Client Connected and Ready ✅");
});

// client MUST be explicitly connected
if (!redisClient.isOpen) {
  redisClient.connect().catch((err) => {
    logger.error("Redis Client failed to connect", err);
  });
}

export default redisClient;
