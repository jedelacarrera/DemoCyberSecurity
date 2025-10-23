import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "8080", 10),

  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "owasp_demo",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    sessionSecret:
      process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    enableVulnerableEndpoints:
      process.env.ENABLE_VULNERABLE_ENDPOINTS === "true",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3100",
  },
};
