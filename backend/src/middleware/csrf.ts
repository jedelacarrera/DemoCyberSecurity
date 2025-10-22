import { Context, Next } from "koa";
import crypto from "crypto";

// Store CSRF tokens in memory (in production, use Redis or similar)
const csrfTokens = new Map<string, string>();

export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const setCsrfToken = (ctx: Context): string => {
  const token = generateCsrfToken();
  const sessionId =
    ctx.cookies.get("sessionId") || crypto.randomBytes(16).toString("hex");

  csrfTokens.set(sessionId, token);
  ctx.cookies.set("sessionId", sessionId, { httpOnly: true });

  return token;
};

export const csrfProtection = async (ctx: Context, next: Next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(ctx.method)) {
    await next();
    return;
  }

  const sessionId = ctx.cookies.get("sessionId");
  const providedToken =
    (ctx.headers["x-csrf-token"] as string) || ctx.request.body?.csrfToken;

  if (!sessionId || !providedToken) {
    ctx.status = 403;
    ctx.body = { success: false, error: "CSRF token missing" };
    return;
  }

  const storedToken = csrfTokens.get(sessionId);

  if (!storedToken || storedToken !== providedToken) {
    ctx.status = 403;
    ctx.body = { success: false, error: "Invalid CSRF token" };
    return;
  }

  await next();
};

export const getCsrfToken = (ctx: Context): string | undefined => {
  const sessionId = ctx.cookies.get("sessionId");
  if (sessionId) {
    return csrfTokens.get(sessionId);
  }
  return undefined;
};
