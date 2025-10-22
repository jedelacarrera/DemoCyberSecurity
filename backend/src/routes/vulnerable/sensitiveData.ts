import Router from "@koa/router";
import { User } from "../../models";

const router = new Router({ prefix: "/api/vulnerable/sensitive-data" });

// VULNERABLE: Storing credit card in plain text
router.post("/save-payment", async (ctx) => {
  const { userId, creditCard, cvv, expiryDate } = ctx.request.body as {
    userId: number;
    creditCard: string;
    cvv: string;
    expiryDate: string;
  };

  try {
    // VULNERABILITY: Storing sensitive data in plain text
    const paymentData = {
      userId,
      creditCard, // Plain text!
      cvv, // Should never be stored!
      expiryDate,
      savedAt: new Date(),
    };

    ctx.body = {
      success: true,
      message: "Payment method saved",
      data: paymentData, // VULNERABILITY: Returning sensitive data
      warning: "Credit card stored in plain text!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Exposing password hashes
router.get("/users/:id", async (ctx) => {
  const { id } = ctx.params;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      ctx.status = 404;
      ctx.body = { success: false, error: "User not found" };
      return;
    }

    // VULNERABILITY: Exposing password hash
    ctx.body = {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password, // CRITICAL: Exposing password hash!
        role: user.role,
      },
      warning: "This exposes password hash!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Weak encryption
router.post("/encrypt-data", async (ctx) => {
  const { data } = ctx.request.body as { data: string };

  if (!data) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Data is required" };
    return;
  }

  // VULNERABILITY: Using weak/outdated encryption (ROT13, Base64, etc.)
  const weaklyEncrypted = Buffer.from(data).toString("base64");

  ctx.body = {
    success: true,
    encrypted: weaklyEncrypted,
    warning: "This uses Base64 encoding, not encryption!",
  };
});

// VULNERABLE: Sending sensitive data over HTTP
router.get("/api-key", async (ctx) => {
  // VULNERABILITY: Exposing API keys
  ctx.body = {
    success: true,
    apiKey: "sk_live_1234567890abcdef",
    secretKey: "secret_key_abc123",
    warning: "API keys exposed in response!",
  };
});

// VULNERABLE: No HTTPS enforcement in headers
router.get("/health", async (ctx) => {
  // VULNERABILITY: No security headers, no HTTPS enforcement
  ctx.body = {
    success: true,
    status: "healthy",
    warning: "No security headers or HTTPS enforcement!",
  };
});

export default router;
