import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../configs/redis.config";
import type { Request } from "express";

function createRedisStore(prefix: string) {
  return new RedisStore({
    prefix,
    sendCommand: (...args: any[]) => redisClient.sendCommand(args),
  });
}

export function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const windowMs = numberFromEnv("RATE_LIMIT_GET_WINDOW_MS", 60000);
const limit = numberFromEnv("RATE_LIMIT_GET_MAX", 60);

// Global GET /api/* limiter (except /api/webhook/*). See src/app.ts.
export const getApiRateLimiter = rateLimit({
  store: createRedisStore("rl:get"),
  windowMs,
  limit,
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
  skip: (req) =>
    req.method !== "GET" ||
    !req.path.startsWith("/api") ||
    req.path.startsWith("/api/webhook"),
});

function rateLimitKey(req: Request): string {
  const maybeUser = (req as Request & { user?: unknown }).user as
    | { id?: number | string; sub?: number | string }
    | undefined;

  const userId = maybeUser?.id ?? maybeUser?.sub;

  const route = `${req.method}:${req.baseUrl}${req.route?.path || req.path}`;
  if (userId !== undefined && userId !== null && `${userId}`.trim() !== "") {
    return `rl:${route}:user:${userId}`;
  }

  const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";

  return `ratelimit:${route}:ip:${ipKeyGenerator(ip)}`;
}

export function createUserOrIpRateLimiter(
  name: string,
  opts: {
    windowMs: number;
    limit: number;
  },
) {
  return rateLimit({
    store: createRedisStore(`rl:${name}:${opts.windowMs}:${opts.limit}:`),
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rateLimitKey,
    message: { message: "Too many requests, please try again later." },
  });
}
