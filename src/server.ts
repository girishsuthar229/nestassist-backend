import "dotenv/config";
import app from "./app";
import sequelize from "./configs/db";
import logger from "./utils/logger";
import { initSocket } from "./socket";
import http from "http";
import { initBookingCleanupJob } from "./jobs/bookingCleanup.job";
import { emailQueue } from "./jobs/queues/email.queue";
import emailWorker from "./jobs/workers/email.worker";
import redisClient from "./configs/redis.config";

const PORT: number = Number(process.env.PORT) || 5000;

app.set("trust proxy", 1);

const server = http.createServer(app);

initSocket(server);
if (process.env.ENABLE_BOOKING_CRON === "true") {
  initBookingCleanupJob();
}

const connectDB = async (retries = 5, delay = 5000): Promise<void> => {
  while (retries) {
    try {
      await sequelize.authenticate();
      logger.info("Database connected successfully ✅");
      return;
    } catch (err) {
      retries -= 1;
      logger.error(`DB connection failed ❌. Retries left: ${retries}`, err);

      if (!retries) {
        logger.error("Exhausted all DB retries. Exiting...");
        process.exit(1);
      }

      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    logger.info(
      `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
    );
  });
};

startServer();

const shutdown = async (signal: string) => {
  logger.info(`\nReceived ${signal}. Closing server...`);

  const forceExit = setTimeout(() => {
    logger.error("Force shutting down...");
    process.exit(1);
  }, 10000);

  try {
    // Close Queues and Workers
    await emailQueue.close();
    await emailWorker.close();
    logger.info("Job queues and workers closed ✅");

    // Close Redis Client
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info("Redis client connection closed ✅");
    }

    // Proper server close handling (see next section)
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    logger.info("HTTP server closed");

    await sequelize.close();
    logger.info("Database connection closed ✅");

    clearTimeout(forceExit);
    process.exit(0);
  } catch (err) {
    clearTimeout(forceExit);
    logger.error("Error during shutdown", err);
    process.exit(1);
  }
};

// Listen to shutdown signals
process.on("SIGINT", shutdown); // Ctrl + C
process.on("SIGTERM", shutdown); // Docker / PM2
