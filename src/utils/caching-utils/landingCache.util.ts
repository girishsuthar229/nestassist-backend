import { RequestHandler } from "express";
import logger from "../logger";
import { clearRedisCache, createRedisCache } from "./redisCache";

export const LANDING_HOME_CACHE_GROUP = "landing:home";

// Public landing-page cache (shared across all users).
export const landingHomeCache = (ttlSeconds: number): RequestHandler => {
  return (req, res, next) => {
    const routePath = req.path;

    return createRedisCache({
      ttlSeconds,
      keyPrefix: `${LANDING_HOME_CACHE_GROUP}:${routePath}`,
    })(req, res, next);
  };
};

// Clear when landing-page relevant entities change (service/service-type/category/etc).
export const clearLandingHomeCache = async () => {
  logger.info("Clearing landing home cache...");
  await clearRedisCache(LANDING_HOME_CACHE_GROUP);
};
