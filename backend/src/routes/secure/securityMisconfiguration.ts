import Router from "@koa/router";
import { config } from "../../config";

const router = new Router({ prefix: "/api/secure/misconfiguration" });

// SECURE: Generic error messages
router.get("/error-example", async (ctx) => {
  try {
    throw new Error("Internal database error");
  } catch (error: any) {
    // SECURE: Generic error message, log details server-side only
    console.error("Error details (logged server-side):", error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: "An internal error occurred. Please try again later.",
      errorId: Date.now(), // Reference ID for support
      note: "Generic error message, details logged server-side",
    };
  }
});

// SECURE: No directory listing
router.get("/files", async (ctx) => {
  // SECURE: No directory listing, only specific allowed file access
  ctx.status = 403;
  ctx.body = {
    success: false,
    error: "Directory listing is disabled",
    note: "Access only specific files through proper endpoints",
  };
});

// SECURE: Strong credentials required
router.post("/admin-login", async (ctx) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  // SECURE: No default credentials, strong authentication required
  // In production, use proper authentication system

  ctx.status = 401;
  ctx.body = {
    success: false,
    error: "Invalid credentials",
    note: "Default credentials disabled, proper authentication required",
  };
});

// SECURE: Debug disabled in production
router.get("/debug-info", async (ctx) => {
  // SECURE: Debug endpoint disabled in production
  if (config.env === "production") {
    ctx.status = 404;
    ctx.body = { success: false, error: "Not found" };
    return;
  }

  // Even in development, limit exposed information
  ctx.body = {
    success: true,
    debug: {
      environment: config.env,
      uptime: process.uptime(),
      // No sensitive environment variables
      // No file system paths
    },
    note: "Debug endpoint only available in development, limited info",
  };
});

// SECURE: Only necessary HTTP methods
router.get("/resource", async (ctx) => {
  ctx.body = {
    success: true,
    message: "Only GET method allowed for this resource",
    note: "Unnecessary HTTP methods disabled",
  };
});

router.post("/resource", async (ctx) => {
  ctx.body = {
    success: true,
    message: "POST method allowed",
    note: "Only necessary methods enabled",
  };
});

// SECURE: All security headers set
router.get("/secure-page", async (ctx) => {
  // SECURE: Set all security headers
  ctx.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  ctx.set("X-Content-Type-Options", "nosniff");
  ctx.set("X-Frame-Options", "DENY");
  ctx.set("X-XSS-Protection", "1; mode=block");
  ctx.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
  ctx.set("Referrer-Policy", "strict-origin-when-cross-origin");
  ctx.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  ctx.body = {
    success: true,
    html: "<html><body>Hello</body></html>",
    note: "All security headers properly configured",
  };
});

// SECURE: Proper CORS configuration
router.get("/cors-secure", async (ctx) => {
  // SECURE: Specific origin, no wildcards with credentials
  const allowedOrigins = ["https://example.com", "https://app.example.com"];
  const origin = ctx.get("Origin");

  if (allowedOrigins.includes(origin)) {
    ctx.set("Access-Control-Allow-Origin", origin);
    ctx.set("Access-Control-Allow-Credentials", "true");
  }

  ctx.body = {
    success: true,
    data: { message: "Secure data" },
    note: "CORS configured with specific allowed origins",
  };
});

export default router;
