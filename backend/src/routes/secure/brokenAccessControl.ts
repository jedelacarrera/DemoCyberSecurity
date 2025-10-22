import Router from "@koa/router";
import { User, Post } from "../../models";
import { authMiddleware, requireAdmin } from "../../middleware/auth";

const router = new Router({ prefix: "/api/secure/access-control" });

// Apply authentication middleware to all routes
router.use(authMiddleware);

// SECURE: Authorization check for post access
router.get("/posts/:id", async (ctx) => {
  const { id } = ctx.params;
  const currentUser = ctx.state.user;

  try {
    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
        },
      ],
    });

    if (!post) {
      ctx.status = 404;
      ctx.body = { success: false, error: "Post not found" };
      return;
    }

    // SECURE: Check if user is authorized (owner or admin)
    if (post.userId !== currentUser.id && currentUser.role !== "admin") {
      ctx.status = 403;
      ctx.body = { success: false, error: "Access denied" };
      return;
    }

    ctx.body = { success: true, data: post };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Ownership verification for editing
router.put("/posts/:id", async (ctx) => {
  const { id } = ctx.params;
  const { title, content } = ctx.request.body as {
    title: string;
    content: string;
  };
  const currentUser = ctx.state.user;

  try {
    const post = await Post.findByPk(id);

    if (!post) {
      ctx.status = 404;
      ctx.body = { success: false, error: "Post not found" };
      return;
    }

    // SECURE: Verify ownership before allowing edit
    if (post.userId !== currentUser.id && currentUser.role !== "admin") {
      ctx.status = 403;
      ctx.body = { success: false, error: "You can only edit your own posts" };
      return;
    }

    await post.update({ title, content });

    ctx.body = { success: true, data: post };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Only return user's own sensitive data or public data
router.get("/users/:id", async (ctx) => {
  const { id } = ctx.params;
  const currentUser = ctx.state.user;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      ctx.status = 404;
      ctx.body = { success: false, error: "User not found" };
      return;
    }

    // SECURE: Return different data based on authorization
    if (user.id === currentUser.id || currentUser.role === "admin") {
      // User can see their own full profile
      ctx.body = {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          // Never expose password hash
        },
      };
    } else {
      // Others only see public profile
      ctx.body = {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          // No email or role for other users
        },
      };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Admin-only endpoint
router.get("/admin/users", requireAdmin, async (ctx) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "role", "createdAt"],
    });

    ctx.body = { success: true, data: users };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Ownership verification for deletion
router.delete("/posts/:id", async (ctx) => {
  const { id } = ctx.params;
  const currentUser = ctx.state.user;

  try {
    const post = await Post.findByPk(id);

    if (!post) {
      ctx.status = 404;
      ctx.body = { success: false, error: "Post not found" };
      return;
    }

    // SECURE: Only owner or admin can delete
    if (post.userId !== currentUser.id && currentUser.role !== "admin") {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error: "You can only delete your own posts",
      };
      return;
    }

    await post.destroy();

    ctx.body = { success: true, message: "Post deleted" };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

export default router;
