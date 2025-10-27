import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "8080", 10),

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
