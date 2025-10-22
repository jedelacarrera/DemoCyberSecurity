import Router from "@koa/router";
import { User } from "../../models";

const router = new Router({ prefix: "/api/vulnerable/rate-limiting" });

// VULNERABLE: No rate limiting on expensive operation
router.post("/heavy-computation", async (ctx) => {
  const { iterations } = ctx.request.body as { iterations: number };

  // VULNERABILITY: No rate limiting allows DoS
  let result = 0;
  for (let i = 0; i < (iterations || 1000000); i++) {
    result += Math.sqrt(i);
  }

  ctx.body = {
    success: true,
    result,
    iterations,
    warning: "No rate limiting - can be abused for DoS!",
  };
});

// VULNERABLE: No rate limiting on API endpoint
router.get("/data", async (ctx) => {
  // VULNERABILITY: Can be called unlimited times
  const users = await User.findAll({ limit: 100 });

  ctx.body = {
    success: true,
    data: users,
    warning: "No rate limiting on API calls!",
  };
});

// VULNERABLE: Brute force login attempts
router.post("/login", async (ctx) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  // VULNERABILITY: No rate limiting allows brute force attacks
  const user = await User.findOne({ where: { username } });

  if (user && (await user.validatePassword(password))) {
    ctx.body = {
      success: true,
      message: "Login successful",
      warning: "No rate limiting - vulnerable to brute force!",
    };
  } else {
    ctx.status = 401;
    ctx.body = { success: false, error: "Invalid credentials" };
  }
});

// VULNERABLE: Resource exhaustion through uploads
router.post("/upload", async (ctx) => {
  const { fileSize } = ctx.request.body as { fileSize: number };

  // VULNERABILITY: No size limits, no rate limiting
  ctx.body = {
    success: true,
    message: `File of ${fileSize} bytes uploaded`,
    warning: "No rate limiting or size limits!",
  };
});

// VULNERABLE: Email bombing
router.post("/send-email", async (ctx) => {
  const { to, subject, body } = ctx.request.body as {
    to: string;
    subject: string;
    body: string;
  };

  // VULNERABILITY: No rate limiting on email sending
  ctx.body = {
    success: true,
    message: `Email sent to ${to}`,
    warning: "No rate limiting - can be used for email bombing!",
  };
});

// VULNERABLE: Scraping vulnerability
router.get("/posts/:page", async (ctx) => {
  const { page } = ctx.params;

  // VULNERABILITY: No rate limiting allows easy scraping
  ctx.body = {
    success: true,
    page: parseInt(page),
    data: Array(100).fill({ title: "Post", content: "Content" }),
    warning: "No rate limiting - easy to scrape all data!",
  };
});

export default router;
