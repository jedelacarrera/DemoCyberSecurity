import { Context, Next } from "koa";
import rateLimit from "koa-ratelimit";

// In-memory store for rate limiting (use Redis in production)
const db = new Map();

export const rateLimiter = rateLimit({
  driver: "memory",
  db: db,
  duration: 60000, // 1 minute
  errorMessage: "Too many requests, please try again later.",
  id: (ctx: Context) => ctx.ip,
  headers: {
    remaining: "Rate-Limit-Remaining",
    reset: "Rate-Limit-Reset",
    total: "Rate-Limit-Total",
  },
  max: 100, // 100 requests per minute
  disableHeader: false,
});

export const strictRateLimiter = rateLimit({
  driver: "memory",
  db: new Map(),
  duration: 60000,
  errorMessage: "Too many requests, please try again later.",
  id: (ctx: Context) => ctx.ip,
  headers: {
    remaining: "Rate-Limit-Remaining",
    reset: "Rate-Limit-Reset",
    total: "Rate-Limit-Total",
  },
  max: 10, // 10 requests per minute
  disableHeader: false,
});

export const loginRateLimiter = rateLimit({
  driver: "memory",
  db: new Map(),
  duration: 300000, // 5 minutes
  errorMessage: "Too many login attempts, please try again later.",
  id: (ctx: Context) => ctx.ip,
  max: 5, // 5 attempts per 5 minutes
  disableHeader: false,
});
