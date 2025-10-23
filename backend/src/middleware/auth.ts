import { Context, Next } from "koa";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { User } from "../models";

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

export const authMiddleware = async (ctx: Context, next: Next) => {
  // Buscar token en header Authorization primero
  let token = ctx.headers.authorization?.replace("Bearer ", "");

  // Si no está en header, buscar en cookies (para CSRF demo)
  if (!token && ctx.cookies.get("auth_token")) {
    token = ctx.cookies.get("auth_token");
    console.log("🍪 Token obtenido desde cookie (CSRF demo)");
  }

  if (!token) {
    ctx.status = 401;
    ctx.body = { success: false, error: "No token provided" };
    return;
  }

  try {
    const decoded = jwt.verify(token, config.security.jwtSecret) as JWTPayload;
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      ctx.status = 401;
      ctx.body = { success: false, error: "User not found" };
      return;
    }

    ctx.state.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { success: false, error: "Invalid token" };
  }
};

export const requireAdmin = async (ctx: Context, next: Next) => {
  if (!ctx.state.user || ctx.state.user.role !== "admin") {
    ctx.status = 403;
    ctx.body = { success: false, error: "Admin access required" };
    return;
  }
  await next();
};

// Vulnerable version - no proper token validation
export const vulnerableAuthMiddleware = async (ctx: Context, next: Next) => {
  const token = ctx.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    ctx.status = 401;
    ctx.body = { success: false, error: "No token provided" };
    return;
  }

  try {
    // VULNERABILITY: Using 'none' algorithm or weak validation
    const decoded = jwt.decode(token) as JWTPayload; // No verification!

    ctx.state.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { success: false, error: "Invalid token" };
  }
};
