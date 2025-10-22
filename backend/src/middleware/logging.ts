import { Context, Next } from "koa";
import { AuditLog } from "../models";

export const auditLogger = async (ctx: Context, next: Next) => {
  const startTime = Date.now();

  await next();

  const duration = Date.now() - startTime;

  // Log the request (secure version - no PII)
  const logEntry = {
    action: `${ctx.method} ${ctx.path}`,
    userId: ctx.state.user?.id,
    ipAddress: ctx.ip,
    userAgent: ctx.headers["user-agent"],
    metadata: {
      statusCode: ctx.status,
      duration,
      // Don't log sensitive data
    },
    timestamp: new Date(),
  };

  try {
    await AuditLog.create(logEntry);
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

// VULNERABLE: Logs PII and sensitive data
export const vulnerableLogger = async (ctx: Context, next: Next) => {
  const startTime = Date.now();

  await next();

  const duration = Date.now() - startTime;

  // VULNERABILITY: Logging sensitive information
  console.log("REQUEST LOG:", {
    method: ctx.method,
    path: ctx.path,
    user: ctx.state.user, // May contain email, password hash
    body: ctx.request.body, // May contain passwords, credit cards
    query: ctx.query,
    headers: ctx.headers, // May contain authorization tokens
    ip: ctx.ip,
    statusCode: ctx.status,
    duration,
    response: ctx.body, // May contain sensitive data
  });

  try {
    await AuditLog.create({
      action: `${ctx.method} ${ctx.path}`,
      userId: ctx.state.user?.id,
      ipAddress: ctx.ip,
      userAgent: ctx.headers["user-agent"],
      metadata: {
        body: ctx.request.body, // VULNERABILITY: Storing request body with potential PII
        query: ctx.query,
        user: ctx.state.user, // VULNERABILITY: Storing user data
        statusCode: ctx.status,
        duration,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};
