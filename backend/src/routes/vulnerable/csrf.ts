import Router from "@koa/router";
import { User } from "../../models";
import { authMiddleware } from "../../middleware/auth";

const router = new Router({ prefix: "/api/vulnerable/csrf" });

// All routes require authentication but have no CSRF protection
router.use(authMiddleware);

// VULNERABLE: No CSRF token validation for state-changing operation
router.post("/transfer-money", async (ctx) => {
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
    // VULNERABILITY: No CSRF token validation
    // An attacker could craft a form on their site that submits here
    ctx.body = {
      success: true,
      message: `Transferred $${amount} from ${currentUser.username} to ${toUser}`,
      warning: "This endpoint has no CSRF protection!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Change email without CSRF protection
router.post("/change-email", async (ctx) => {
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
      // VULNERABILITY: No CSRF protection - can be exploited via malicious site
      await user.update({ email: newEmail });

      ctx.body = {
        success: true,
        message: `Email changed to ${newEmail}`,
        warning: "This endpoint has no CSRF protection!",
      };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Delete account without CSRF protection
router.post("/delete-account", async (ctx) => {
  const currentUser = ctx.state.user;

  try {
    // VULNERABILITY: Critical action with no CSRF protection
    ctx.body = {
      success: true,
      message: `Account ${currentUser.username} would be deleted`,
      warning:
        "This endpoint has no CSRF protection! Attacker could delete your account!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;
