import Router from "@koa/router";
import { User, Post } from "../../models";

const router = new Router({ prefix: "/api/vulnerable/access-control" });

// VULNERABLE: No authorization check - any user can access any post
router.get("/posts/:id", async (ctx) => {
  const { id } = ctx.params;

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

    // VULNERABILITY: No check if user is authorized to view this post
    ctx.body = { success: true, data: post };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: IDOR - can edit any user's post
router.put("/posts/:id", async (ctx) => {
  const { id } = ctx.params;
  const { title, content } = ctx.request.body as {
    title: string;
    content: string;
  };

  try {
    const post = await Post.findByPk(id);

    if (!post) {
      ctx.status = 404;
      ctx.body = { success: false, error: "Post not found" };
      return;
    }

    // VULNERABILITY: No check if current user owns this post
    await post.update({ title, content });

    ctx.body = { success: true, data: post };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Can access any user's profile and sensitive data
router.get("/users/:id", async (ctx) => {
  const { id } = ctx.params;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      ctx.status = 404;
      ctx.body = { success: false, error: "User not found" };
      return;
    }

    // VULNERABILITY: Exposing sensitive information without authorization
    ctx.body = {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email, // Sensitive: email should be private
        role: user.role,
        password: user.password, // CRITICAL: Never expose password hash!
      },
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: No role check - any user can access admin endpoint
router.get("/admin/users", async (ctx) => {
  try {
    // VULNERABILITY: No admin role verification
    const users = await User.findAll();

    ctx.body = { success: true, data: users };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Can delete any post
router.delete("/posts/:id", async (ctx) => {
  const { id } = ctx.params;

  try {
    const post = await Post.findByPk(id);

    if (!post) {
      ctx.status = 404;
      ctx.body = { success: false, error: "Post not found" };
      return;
    }

    // VULNERABILITY: No ownership or admin check
    await post.destroy();

    ctx.body = { success: true, message: "Post deleted" };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;
