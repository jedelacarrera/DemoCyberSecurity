import Koa, { Context } from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import { config } from "./config";
import { sequelize } from "./models";

// Import routers
import authRouter from "./routes/auth";

// Vulnerable routes
import sqlInjectionVulnerable from "./routes/vulnerable/sqlInjection";
import xssVulnerable from "./routes/vulnerable/xss";
import commandInjectionVulnerable from "./routes/vulnerable/commandInjection";
import brokenAccessControlVulnerable from "./routes/vulnerable/brokenAccessControl";
import csrfVulnerable from "./routes/vulnerable/csrf";
import ssrfVulnerable from "./routes/vulnerable/ssrf";
import authFailuresVulnerable from "./routes/vulnerable/authFailures";
import sensitiveDataVulnerable from "./routes/vulnerable/sensitiveData";
import insecureDeserializationVulnerable from "./routes/vulnerable/insecureDeserialization";
import securityMisconfigurationVulnerable from "./routes/vulnerable/securityMisconfiguration";
import secretsExposureVulnerable from "./routes/vulnerable/secretsExposure";
import rateLimitingVulnerable from "./routes/vulnerable/rateLimiting";

// Secure routes
import sqlInjectionSecure from "./routes/secure/sqlInjection";
import xssSecure from "./routes/secure/xss";
import commandInjectionSecure from "./routes/secure/commandInjection";
import brokenAccessControlSecure from "./routes/secure/brokenAccessControl";
import csrfSecure from "./routes/secure/csrf";
import ssrfSecure from "./routes/secure/ssrf";
import authFailuresSecure from "./routes/secure/authFailures";
import sensitiveDataSecure from "./routes/secure/sensitiveData";
import insecureDeserializationSecure from "./routes/secure/insecureDeserialization";
import securityMisconfigurationSecure from "./routes/secure/securityMisconfiguration";
import secretsExposureSecure from "./routes/secure/secretsExposure";
import rateLimitingSecure from "./routes/secure/rateLimiting";

const app = new Koa();

// Middleware - Smart CORS (vulnerable for /api/vulnerable/*, secure for others)
app.use(
  cors({
    origin: (ctx: Context): string => {
      const origin = ctx.request.headers.origin;
      const path = ctx.request.path;

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return "*";

      // VULNERABLE ENDPOINTS: Allow all origins (demonstrates CORS misconfiguration)
      if (path.startsWith("/api/vulnerable/")) {
        console.log(
          `⚠️  VULNERABLE CORS: Allowing origin ${origin} for vulnerable endpoint`
        );
        return origin;
      }

      // SECURE ENDPOINTS: Only allow whitelisted origins
      const allowedOrigins = [
        config.cors.origin,
        process.env.ATTACKER_URL || "http://localhost:3002",
        "http://localhost:3000", // Docker frontend
        "http://localhost:3100", // Local frontend
      ];

      if (allowedOrigins.includes(origin)) {
        console.log(`✅ SECURE CORS: Allowing whitelisted origin ${origin}`);
        return origin;
      } else {
        console.log(
          `🚫 SECURE CORS: Blocked origin ${origin} for secure endpoint`
        );
        // Return empty string to block (won't set CORS headers)
        return "";
      }
    },
    credentials: true,
  })
);

app.use(
  bodyParser({
    jsonLimit: "10mb",
  })
);

// Request logging
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      error:
        config.env === "production" ? "Internal server error" : err.message,
    };
    console.error("Error:", err);
  }
});

// Health check
app.use(async (ctx, next) => {
  if (ctx.path === "/health") {
    ctx.body = { success: true, status: "healthy" };
    return;
  }
  await next();
});

// Register routers
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

// Vulnerable routes
if (config.security.enableVulnerableEndpoints) {
  console.warn(
    "⚠️  WARNING: Vulnerable endpoints are enabled! Only for demo purposes!"
  );

  app.use(sqlInjectionVulnerable.routes());
  app.use(xssVulnerable.routes());
  app.use(commandInjectionVulnerable.routes());
  app.use(brokenAccessControlVulnerable.routes());
  app.use(csrfVulnerable.routes());
  app.use(ssrfVulnerable.routes());
  app.use(authFailuresVulnerable.routes());
  app.use(sensitiveDataVulnerable.routes());
  app.use(insecureDeserializationVulnerable.routes());
  app.use(securityMisconfigurationVulnerable.routes());
  app.use(secretsExposureVulnerable.routes());
  app.use(rateLimitingVulnerable.routes());
}

// Secure routes
app.use(sqlInjectionSecure.routes());
app.use(xssSecure.routes());
app.use(commandInjectionSecure.routes());
app.use(brokenAccessControlSecure.routes());
app.use(csrfSecure.routes());
app.use(ssrfSecure.routes());
app.use(authFailuresSecure.routes());
app.use(sensitiveDataSecure.routes());
app.use(insecureDeserializationSecure.routes());
app.use(securityMisconfigurationSecure.routes());
app.use(secretsExposureSecure.routes());
app.use(rateLimitingSecure.routes());

// 404 handler
app.use(async (ctx) => {
  ctx.status = 404;
  ctx.body = { success: false, error: "Not found" };
});

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Sync database (in production, use migrations)
    if (config.env === "development") {
      await sequelize.sync({ alter: false });
      console.log("✅ Database synchronized.");
    }

    // Start server
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${config.env}`);
      console.log(
        `🔒 Vulnerable endpoints: ${
          config.security.enableVulnerableEndpoints ? "ENABLED ⚠️" : "DISABLED"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
