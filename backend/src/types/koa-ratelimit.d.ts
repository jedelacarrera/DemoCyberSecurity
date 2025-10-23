declare module "koa-ratelimit" {
  import { Context, Next } from "koa";

  interface RateLimitOptions {
    driver?: "memory" | "redis";
    db?: any;
    max?: number;
    duration?: number;
    errorMessage?: string;
    id?: (ctx: Context) => string;
    headers?: {
      remaining?: string;
      reset?: string;
      total?: string;
    };
    disableHeader?: boolean;
    whitelist?: (ctx: Context) => boolean;
    blacklist?: (ctx: Context) => boolean;
    onLimitReached?: (ctx: Context) => void;
  }

  function rateLimit(
    options: RateLimitOptions
  ): (ctx: Context, next: Next) => Promise<void>;

  export = rateLimit;
}
