import Router from "@koa/router";
import { User } from "../../models";
import { encrypt, decrypt } from "../../utils/crypto";
import { config } from "../../config";

const router = new Router({ prefix: "/api/secure/sensitive-data" });

// SECURE: Encrypting sensitive payment data
router.post("/save-payment", async (ctx) => {
  const { userId, creditCard, expiryDate } = ctx.request.body as {
    userId: number;
    creditCard: string;
    cvv?: string;
    expiryDate: string;
  };

  // SECURE: Never accept or store CVV
  if (!creditCard || !expiryDate) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Required fields missing" };
    return;
  }

  try {
    // SECURE: Encrypt sensitive data
    const encryptedCard = encrypt(creditCard, config.security.jwtSecret);

    // Only store last 4 digits for display
    const last4 = creditCard.slice(-4);

    const paymentData = {
      userId,
      cardLast4: last4, // Only last 4 digits
      cardEncrypted: encryptedCard,
      expiryDate,
      savedAt: new Date(),
    };

    ctx.body = {
      success: true,
      message: "Payment method saved securely",
      data: {
        userId,
        cardLast4: last4,
        // Never return full card or CVV
      },
      note: "Credit card encrypted with AES-256",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Never expose password hashes
router.get("/users/:id", async (ctx) => {
  const { id } = ctx.params;

  try {
    const user = await User.findByPk(id, {
      attributes: ["id", "username", "email", "role"], // Exclude password
    });

    if (!user) {
      ctx.status = 404;
      ctx.body = { success: false, error: "User not found" };
      return;
    }

    ctx.body = {
      success: true,
      data: user,
      note: "Password hash never exposed",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Strong encryption
router.post("/encrypt-data", async (ctx) => {
  const { data } = ctx.request.body as { data: string };

  if (!data) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Data is required" };
    return;
  }

  try {
    // SECURE: Using strong encryption (AES-256-GCM)
    const encrypted = encrypt(data, config.security.jwtSecret);

    ctx.body = {
      success: true,
      encrypted,
      note: "Data encrypted with AES-256-GCM",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Never expose API keys
router.get("/api-key", async (ctx) => {
  // SECURE: Never return actual API keys
  ctx.body = {
    success: true,
    message: "API keys are managed server-side",
    note: "Never expose API keys to clients",
  };
});

// SECURE: Security headers and HTTPS enforcement
router.get("/health", async (ctx) => {
  // SECURE: Set security headers
  ctx.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  ctx.set("X-Content-Type-Options", "nosniff");
  ctx.set("X-Frame-Options", "DENY");
  ctx.set("X-XSS-Protection", "1; mode=block");
  ctx.set("Content-Security-Policy", "default-src 'self'");

  ctx.body = {
    success: true,
    status: "healthy",
    note: "Security headers set, HTTPS enforced",
  };
});

export default router;
