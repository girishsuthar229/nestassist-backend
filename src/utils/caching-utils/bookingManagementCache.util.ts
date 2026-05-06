import type { RequestHandler } from "express";
import logger from "../logger";
import { clearRedisCache, createRedisCache } from "./redisCache";

export const BOOKING_MANAGEMENT_CACHE_GROUP = "booking:management";

// Admin booking-management cache
export const bookingManagementCache = (ttlSeconds: number): RequestHandler => {
  return (req, res, next) => {
    const routePath = req.path;

    // Stable query key (important for filters like status, date, etc.)
    const queryKey = Object.keys(req.query || {})
      .sort()
      .map((key) => `${key}=${req.query[key]}`)
      .join("&");

    return createRedisCache({
      ttlSeconds,
      keyPrefix: `${BOOKING_MANAGEMENT_CACHE_GROUP}:${routePath}:${queryKey}`,
    })(req, res, next);
  };
};

// Clear after any booking-management write that affects list/filters.
export const clearBookingManagementCache = async () => {
  logger.info("Clearing booking management admin cache");
  await clearRedisCache(BOOKING_MANAGEMENT_CACHE_GROUP);
};
