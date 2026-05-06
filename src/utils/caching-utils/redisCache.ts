import type { Request, Response, NextFunction } from "express";
import redisClient from "../../configs/redis.config";
import logger from "../logger";

export const createRedisCache = (opts: {
  ttlSeconds: number;
  keyPrefix?: string;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!opts.ttlSeconds || opts.ttlSeconds <= 0) return next();

    const key = `${opts.keyPrefix || "cache"}:` + `${req.originalUrl}`;

    try {
      const cached = await redisClient.get(key);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        redisClient
          .setEx(key, opts.ttlSeconds, JSON.stringify(body))
          .catch((err) => {
            logger.error("Redis cache set error:", err);
          });

        return originalJson(body);
      };
      next();
    } catch (err) {
      logger.error("Redis cache error:", err);
      next();
    }
  };
};

/**
 * Scan Redis keys safely (non-blocking alternative to KEYS)
 */
async function scanKeys(pattern: string): Promise<string[]> {
  let cursor = "0";
  const keys: string[] = [];

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });

    cursor = result.cursor;
    keys.push(...result.keys);
  } while (cursor !== "0");

  return keys;
}

/**
 * Clear cache by prefix or pattern
 *
 * Examples:
 *  clearCache("dashboard")
 *  clearCache("users:*")
 *  clearCache("ratelimit:*")
 */
export const clearRedisCache = async (pattern: string): Promise<number> => {
  try {
    // Normalize pattern
    const finalPattern = pattern.includes("*") ? pattern : `${pattern}:*`;

    const keys = await scanKeys(finalPattern);

    if (!keys.length) return 0;

    const deleted = await redisClient.del(keys);
    return deleted;
  } catch (err) {
    logger.error("Redis clearCache error:", err);
    return 0;
  }
};
