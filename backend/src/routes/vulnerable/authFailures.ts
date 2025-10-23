import Router from "@koa/router";
import jwt from "jsonwebtoken";
import { User, Session } from "../../models";
import { config } from "../../config";
import { vulnerableAuthMiddleware } from "../../middleware/auth";

const router = new Router({ prefix: "/api/vulnerable/auth" });

// VULNERABLE: Weak password requirements
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

  // VULNERABILITY: No password strength validation
  // Accepts passwords like "123", "password", etc.

  try {
    const user = await User.create({
      username,
      email,
      password, // Weak password accepted
      role: "user",
    });

    ctx.body = {
      success: true,
      data: { username: user.username },
      warning: "This endpoint accepts weak passwords!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: JWT with 'none' algorithm
router.post("/login-none-alg", async (ctx) => {
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

    // VULNERABILITY: Token can be forged by setting alg: 'none'
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      "", // No secret!
      { algorithm: "none" as any }
    );

    ctx.body = {
      success: true,
      data: { token },
      warning: 'This JWT uses the "none" algorithm and can be forged!',
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Session fixation
router.post("/login-session-fixation", async (ctx) => {
  const { username, password, sessionId } = ctx.request.body as {
    username: string;
    password: string;
    sessionId?: string;
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

    // VULNERABILITY: Accepts sessionId from client (session fixation)
    const finalSessionId = sessionId || `session_${Date.now()}`;

    await Session.create({
      userId: user.id!,
      token: finalSessionId,
      data: JSON.stringify({ username: user.username }),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    ctx.body = {
      success: true,
      sessionId: finalSessionId,
      warning: "This endpoint is vulnerable to session fixation!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: No rate limiting on password reset
router.post("/reset-password", async (ctx) => {
  const { email } = ctx.request.body as { email: string };

  if (!email) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Email is required" };
    return;
  }

  // VULNERABILITY: No rate limiting - can enumerate users
  try {
    const user = await User.findOne({ where: { email } });

    if (user) {
      ctx.body = {
        success: true,
        message: "Password reset email sent",
        warning: "No rate limiting allows user enumeration!",
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: "User not found",
        warning: "This reveals whether email exists in database!",
      };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Endpoint using vulnerable auth middleware
router.get("/profile", vulnerableAuthMiddleware, async (ctx) => {
  ctx.body = {
    success: true,
    data: ctx.state.user,
    warning:
      "This endpoint uses vulnerable JWT verification (decode without verify)!",
  };
});

export default router;
