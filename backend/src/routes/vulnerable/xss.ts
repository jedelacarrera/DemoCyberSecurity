import Router from "@koa/router";
import { Post, User } from "../../models";

const router = new Router({ prefix: "/api/vulnerable/xss" });

// VULNERABLE: Stored XSS - posts without sanitization
router.post("/posts", async (ctx) => {
  const { title, content } = ctx.request.body as {
    title: string;
    content: string;
  };
  const userId = ctx.state.user?.id || 2; // Default to demo user

  if (!title || !content) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Title and content are required" };
    return;
  }

  try {
    // VULNERABILITY: No sanitization of user input
    const post = await Post.create({
      title,
      content, // XSS payload could be stored here
      userId,
    });

    ctx.body = {
      success: true,
      data: post,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Returns unsanitized content
router.get("/posts", async (ctx) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // VULNERABILITY: Returning raw content without sanitization
    ctx.body = {
      success: true,
      data: posts,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Reflected XSS in search results
router.get("/search", async (ctx) => {
  const { q } = ctx.query;

  try {
    const posts = await Post.findAll({
      where: q ? { title: { [require("sequelize").Op.like]: `%${q}%` } } : {},
      limit: 10,
    });

    // VULNERABILITY: Reflecting user input without sanitization
    ctx.body = {
      success: true,
      searchQuery: q, // XSS payload could be reflected here
      data: posts,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: DOM-based XSS via user profile
router.get("/profile/:username", async (ctx) => {
  const { username } = ctx.params;

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      ctx.status = 404;
      // VULNERABILITY: Reflecting username without sanitization
      ctx.body = {
        success: false,
        error: `User ${username} not found`,
      };
      return;
    }

    ctx.body = {
      success: true,
      data: {
        username: user.username, // Could contain XSS payload
        email: user.email,
      },
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;
