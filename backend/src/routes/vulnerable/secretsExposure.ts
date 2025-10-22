import Router from "@koa/router";

const router = new Router({ prefix: "/api/vulnerable/secrets" });

// VULNERABLE: Hardcoded credentials in code
const DB_PASSWORD = "SuperSecret123!"; // VULNERABILITY: Hardcoded password
const API_KEY = "sk_live_1234567890abcdef"; // VULNERABILITY: Hardcoded API key
const JWT_SECRET = "my-super-secret-key"; // VULNERABILITY: Hardcoded secret

// VULNERABLE: Exposing secrets in response
router.get("/config", async (ctx) => {
  ctx.body = {
    success: true,
    config: {
      database: {
        host: "db.example.com",
        port: 5432,
        username: "admin",
        password: DB_PASSWORD, // CRITICAL: Exposing password!
      },
      apiKeys: {
        stripe: API_KEY, // CRITICAL: Exposing API key!
        github: "ghp_1234567890abcdefghijklmnopqrst",
      },
      jwtSecret: JWT_SECRET, // CRITICAL: Exposing JWT secret!
    },
    warning: "This exposes all secrets!",
  };
});

// VULNERABLE: Secrets in logs
router.post("/connect-database", async (ctx) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  // VULNERABILITY: Logging credentials
  console.log(
    `Connecting to database with username: ${username} and password: ${password}`
  );

  ctx.body = {
    success: true,
    message: "Database connection established",
    credentials: { username, password }, // VULNERABILITY: Returning credentials
    warning: "Credentials logged and returned!",
  };
});

// VULNERABLE: Secrets in error messages
router.get("/api-call", async (ctx) => {
  try {
    throw new Error(`API call failed with key: ${API_KEY}`);
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message, // VULNERABILITY: Secret in error message
      warning: "Secret exposed in error!",
    };
  }
});

// VULNERABLE: Secrets in git
router.get("/git-secrets", async (ctx) => {
  ctx.body = {
    success: true,
    message: "Check .env file in git repository",
    envExample: {
      AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
      AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      DATABASE_URL: "postgresql://user:password@localhost:5432/dbname",
    },
    warning: "These secrets would be committed to git!",
  };
});

// VULNERABLE: Client-side secrets
router.get("/client-config", async (ctx) => {
  ctx.body = {
    success: true,
    config: {
      apiEndpoint: "https://api.example.com",
      apiKey: API_KEY, // VULNERABILITY: Sending secret to client
      encryptionKey: "client-side-encryption-key",
    },
    warning: "Secrets sent to client!",
  };
});

export default router;
