import type { RequestHandler } from "express";
import logger from "../logger";
import { clearRedisCache, createRedisCache } from "./redisCache";

export const DASHBOARD_CACHE_GROUP = "dashboard";

type DashboardCacheOptions = number;

export const dashboardCache = (
  options: DashboardCacheOptions,
): RequestHandler => {
  return (req, res, next) => {
    let ttlSeconds: number;

    ttlSeconds = options;

    return createRedisCache({
      ttlSeconds,
      keyPrefix: `${DASHBOARD_CACHE_GROUP}:${req.path}`,
    })(req, res, next);
  };
};

// Clear when dashboard-driving data changes
export const clearDashboardCache = async () => {
  logger.info("Clearing admin dashboard cache");
  await clearRedisCache(DASHBOARD_CACHE_GROUP);
};
