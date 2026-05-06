import type { RequestHandler } from "express";
import logger from "../logger";
import { clearRedisCache, createRedisCache } from "./redisCache";

export const SERVICE_ADMIN_CACHE_GROUP = "service:admin";

// Service-management cache (shared; response already filtered by query params).
// Use for read endpoints that are frequently requested (e.g. list-by-category).
export const serviceAdminCache = (ttlSeconds: number): RequestHandler => {
  return (req, res, next) => {
    const routePath = req.path;

    // Stable query key (prevents order issues)
    const queryKey = Object.keys(req.query || {})
      .sort()
      .map((key) => `${key}=${req.query[key]}`)
      .join("&");

    return createRedisCache({
      ttlSeconds,
      keyPrefix: `${SERVICE_ADMIN_CACHE_GROUP}:${routePath}:${queryKey}`,
    })(req, res, next);
  };
};

// Clear after create/update/delete so list endpoints don't serve stale data.
export const clearServiceAdminCache = async () => {
  logger.info("Clearing service management admin cache");
  await clearRedisCache(SERVICE_ADMIN_CACHE_GROUP);
};
