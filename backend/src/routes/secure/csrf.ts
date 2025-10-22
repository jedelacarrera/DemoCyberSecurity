import Router from "@koa/router";
import { User } from "../../models";
import { authMiddleware } from "../../middleware/auth";
import {
  csrfProtection,
  setCsrfToken,
  getCsrfToken,
} from "../../middleware/csrf";

const router = new Router({ prefix: "/api/secure/csrf" });

router.use(authMiddleware);

// Get CSRF token
router.get("/token", async (ctx) => {
  const token = setCsrfToken(ctx);

  ctx.body = {
    success: true,
    csrfToken: token,
  };
});

// SECURE: CSRF token validation for money transfer
router.post("/transfer-money", csrfProtection, async (ctx) => {
  const { toUser, amount } = ctx.request.body as {
    toUser: string;
    amount: number;
  };
  const currentUser = ctx.state.user;

  if (!toUser || !amount) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Missing parameters" };
    return;
  }

  try {
    // SECURE: CSRF token was validated by middleware
    ctx.body = {
      success: true,
      message: `Transferred $${amount} from ${currentUser.username} to ${toUser}`,
      note: "This endpoint is protected with CSRF token",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Change email with CSRF protection
router.post("/change-email", csrfProtection, async (ctx) => {
  const { newEmail } = ctx.request.body as { newEmail: string };
  const currentUser = ctx.state.user;

  if (!newEmail) {
    ctx.status = 400;
    ctx.body = { success: false, error: "New email is required" };
    return;
  }

  try {
    const user = await User.findByPk(currentUser.id);
    if (user) {
      await user.update({ email: newEmail });

      ctx.body = {
        success: true,
        message: `Email changed to ${newEmail}`,
        note: "This endpoint is protected with CSRF token",
      };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Delete account with CSRF protection
router.post("/delete-account", csrfProtection, async (ctx) => {
  const currentUser = ctx.state.user;

  try {
    ctx.body = {
      success: true,
      message: `Account ${currentUser.username} deletion initiated`,
      note: "This endpoint is protected with CSRF token",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

export default router;
