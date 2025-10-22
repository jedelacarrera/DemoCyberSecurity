import Router from "@koa/router";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { config } from "../config";
import { loginRateLimiter } from "../middleware/rateLimiter";

const router = new Router({ prefix: "/api/auth" });

// Secure login
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

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.security.jwtSecret,
      { expiresIn: "24h" }
    );

    ctx.body = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// Secure register
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

  if (password.length < 8) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      error: "Password must be at least 8 characters",
    };
    return;
  }

  try {
    const existingUser = await User.findOne({
      where: { username },
    });

    if (existingUser) {
      ctx.status = 400;
      ctx.body = { success: false, error: "Username already exists" };
      return;
    }

    const user = await User.create({
      username,
      email,
      password,
      role: "user",
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.security.jwtSecret,
      { expiresIn: "24h" }
    );

    ctx.body = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

export default router;
