import Router from "@koa/router";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, Session } from "../../models";
import { config } from "../../config";
import { authMiddleware } from "../../middleware/auth";
import { loginRateLimiter } from "../../middleware/rateLimiter";

const router = new Router({ prefix: "/api/secure/auth" });

// SECURE: Strong password requirements
router.post("/register", async (ctx) => {
  const { username, email, password } = ctx.request.body as {
    username: string;
    email: string;
    password: string;
  };

  if (!username || !email || !password) {
    ctx.status = 400;
    ctx.body = { success: false, error: "All fields are required" };
    return;
  }

  // SECURE: Password strength validation
  const passwordErrors: string[] = [];
  if (password.length < 8) passwordErrors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) passwordErrors.push("one uppercase letter");
  if (!/[a-z]/.test(password)) passwordErrors.push("one lowercase letter");
  if (!/[0-9]/.test(password)) passwordErrors.push("one number");
  if (!/[^A-Za-z0-9]/.test(password))
    passwordErrors.push("one special character");

  if (passwordErrors.length > 0) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      error: `Password must contain ${passwordErrors.join(", ")}`,
    };
    return;
  }

  try {
    const user = await User.create({
      username,
      email,
      password,
      role: "user",
    });

    ctx.body = {
      success: true,
      data: { username: user.username },
      note: "Password meets strong requirements",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Proper JWT signing
router.post("/login", loginRateLimiter, async (ctx) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Username and password are required" };
    return;
  }

  try {
    const user = await User.findOne({ where: { username } });

    if (!user || !(await user.validatePassword(password))) {
      ctx.status = 401;
      ctx.body = { success: false, error: "Invalid credentials" };
      return;
    }

    // SECURE: Strong secret and algorithm
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.security.jwtSecret,
      { algorithm: "HS256", expiresIn: "24h" }
    );

    ctx.body = {
      success: true,
      data: { token },
      note: "JWT properly signed with strong secret",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Protection against session fixation
router.post("/login-secure-session", loginRateLimiter, async (ctx) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Username and password are required" };
    return;
  }

  try {
    const user = await User.findOne({ where: { username } });

    if (!user || !(await user.validatePassword(password))) {
      ctx.status = 401;
      ctx.body = { success: false, error: "Invalid credentials" };
      return;
    }

    // SECURE: Generate session ID on server side
    const sessionId = crypto.randomBytes(32).toString("hex");

    await Session.create({
      userId: user.id!,
      token: sessionId,
      data: JSON.stringify({ username: user.username }),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    ctx.body = {
      success: true,
      sessionId,
      note: "Session ID generated server-side, preventing fixation",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Rate-limited password reset with no user enumeration
router.post("/reset-password", loginRateLimiter, async (ctx) => {
  const { email } = ctx.request.body as { email: string };

  if (!email) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Email is required" };
    return;
  }

  try {
    const user = await User.findOne({ where: { email } });

    // SECURE: Always return same message (no user enumeration)
    // In production, send email only if user exists
    if (user) {
      // Send password reset email
    }

    // Always return success to prevent enumeration
    ctx.body = {
      success: true,
      message: "If that email exists, a password reset link has been sent",
      note: "Same message regardless of user existence prevents enumeration",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Endpoint using secure auth middleware
router.get("/profile", authMiddleware, async (ctx) => {
  ctx.body = {
    success: true,
    data: ctx.state.user,
    note: "JWT properly verified with secret",
  };
});

export default router;
