import Router from "@koa/router";
import { User } from "../../models";
import {
  rateLimiter,
  strictRateLimiter,
  loginRateLimiter,
} from "../../middleware/rateLimiter";

const router = new Router({ prefix: "/api/secure/rate-limiting" });

// SECURE: Rate limiting on expensive operation
router.post("/heavy-computation", strictRateLimiter, async (ctx) => {
  const { iterations } = ctx.request.body as { iterations: number };

  // SECURE: Rate limited + input validation
  const maxIterations = 100000;
  const safeIterations = Math.min(iterations || 1000, maxIterations);

  let result = 0;
  for (let i = 0; i < safeIterations; i++) {
    result += Math.sqrt(i);
  }

  ctx.body = {
    success: true,
    result,
    iterations: safeIterations,
    note: "Rate limited (10 requests/minute) and input capped",
  };
});

// SECURE: Rate limiting on API endpoint
router.get("/data", rateLimiter, async (ctx) => {
  const users = await User.findAll({
    limit: 100,
    attributes: ["id", "username"],
  });

  ctx.body = {
    success: true,
    data: users,
    note: "Rate limited (100 requests/minute)",
  };
});

// SECURE: Rate limiting on login
router.post("/login", loginRateLimiter, async (ctx) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  // SECURE: Rate limited (5 attempts per 5 minutes per IP)
  const user = await User.findOne({ where: { username } });

  if (user && (await user.validatePassword(password))) {
    ctx.body = {
      success: true,
      message: "Login successful",
      note: "Rate limited (5 attempts per 5 minutes)",
    };
  } else {
    ctx.status = 401;
    ctx.body = { success: false, error: "Invalid credentials" };
  }
});

// SECURE: File upload with size limits and rate limiting
router.post("/upload", strictRateLimiter, async (ctx) => {
  const { fileSize } = ctx.request.body as { fileSize: number };

  // SECURE: Enforce size limits
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  if (fileSize > MAX_FILE_SIZE) {
    ctx.status = 413;
    ctx.body = { success: false, error: "File too large" };
    return;
  }

  ctx.body = {
    success: true,
    message: `File of ${fileSize} bytes uploaded`,
    note: "Rate limited (10/minute) with 10MB size limit",
  };
});

// SECURE: Email sending with rate limiting
router.post("/send-email", strictRateLimiter, async (ctx) => {
  const { to, subject, body } = ctx.request.body as {
    to: string;
    subject: string;
    body: string;
  };

  if (!to || !subject || !body) {
    ctx.status = 400;
    ctx.body = { success: false, error: "All fields required" };
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid email format" };
    return;
  }

  ctx.body = {
    success: true,
    message: `Email sent to ${to}`,
    note: "Rate limited (10 emails per minute per IP)",
  };
});

// SECURE: Scraping protection with rate limiting
router.get("/posts/:page", rateLimiter, async (ctx) => {
  const { page } = ctx.params;
  const pageNum = parseInt(page);

  // Validate page number
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid page number" };
    return;
  }

  ctx.body = {
    success: true,
    page: pageNum,
    data: Array(20).fill({ title: "Post", content: "Content" }), // Smaller page size
    note: "Rate limited (100 requests/minute), pagination validated",
  };
});

export default router;
