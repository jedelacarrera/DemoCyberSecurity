import Router from "@koa/router";
import { config } from "../../config";

const router = new Router({ prefix: "/api/secure/secrets" });

// SECURE: Secrets from environment variables, never exposed
router.get("/config", async (ctx) => {
  ctx.body = {
    success: true,
    config: {
      database: {
        host: config.database.host,
        port: config.database.port,
        // Never expose username/password
      },
      apiEndpoint: "https://api.example.com",
      // Never expose API keys or secrets
    },
    note: "Secrets loaded from environment, never exposed",
  };
});

// SECURE: Never log credentials
router.post("/connect-database", async (ctx) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  // SECURE: Log only non-sensitive info
  console.log(`Database connection attempt for user: ${username}`);
  // Never log password!

  ctx.body = {
    success: true,
    message: "Database connection established",
    // Never return credentials
    note: "Credentials processed securely, not logged or returned",
  };
});

// SECURE: Generic error messages
router.get("/api-call", async (ctx) => {
  try {
    // API call logic here
    // If error occurs, don't expose secrets
    throw new Error("API call failed");
  } catch (error: any) {
    // SECURE: Log full error server-side, return generic message
    console.error("API error (server-side only):", error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: "API call failed. Please try again later.",
      note: "Generic error message, no secrets exposed",
    };
  }
});

// SECURE: .env file in .gitignore
router.get("/git-secrets", async (ctx) => {
  ctx.body = {
    success: true,
    message: "Secrets management best practices",
    bestPractices: [
      "Add .env to .gitignore",
      "Use .env.example for templates",
      "Use secret management services (AWS Secrets Manager, Vault)",
      "Rotate secrets regularly",
      "Never commit secrets to git",
      "Use git-secrets or similar tools to prevent accidental commits",
    ],
    note: "Proper secrets management in place",
  };
});

// SECURE: Only public config to client
router.get("/client-config", async (ctx) => {
  ctx.body = {
    success: true,
    config: {
      apiEndpoint: "https://api.example.com",
      // Only public configuration
      // No API keys, no secrets
      publicKey: "pk_public_key_for_client_use", // Only public keys
    },
    note: "Only public configuration sent to client",
  };
});

// SECURE: Using environment variables
router.get("/environment-example", async (ctx) => {
  // SECURE: Access secrets from environment
  const dbConfigured = !!config.database.password; // Check without exposing
  const jwtConfigured = !!config.security.jwtSecret;

  ctx.body = {
    success: true,
    secretsConfigured: {
      database: dbConfigured,
      jwt: jwtConfigured,
    },
    message: "Secrets loaded from environment variables",
    note: "Values never exposed, only confirmation that they exist",
  };
});

export default router;
