import Router from "@koa/router";
import { Op } from "sequelize";
import { Post, User } from "../../models";
import { sanitizeInput, escapeHtml } from "../../utils/validation";

const router = new Router({ prefix: "/api/secure/xss" });

// SECURE: Sanitized input for posts
router.post("/posts", async (ctx) => {
  const { title, content } = ctx.request.body as {
    title: string;
    content: string;
  };
  const userId = ctx.state.user?.id || 2;

  if (!title || !content) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Title and content are required" };
    return;
  }

  try {
    // SECURE: Sanitize user input before storing
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedContent = sanitizeInput(content);

    const post = await Post.create({
      title: sanitizedTitle,
      content: sanitizedContent,
      userId,
    });

    ctx.body = {
      success: true,
      data: post,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Returns sanitized content
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

    // SECURE: Sanitize output (defense in depth)
    const sanitizedPosts = posts.map((post) => ({
      ...post.toJSON(),
      title: escapeHtml(post.title),
      content: escapeHtml(post.content),
    }));

    ctx.body = {
      success: true,
      data: sanitizedPosts,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Sanitized search results
router.get("/search", async (ctx) => {
  const { q } = ctx.query;

  try {
    const posts = await Post.findAll({
      where:
        q && typeof q === "string" ? { title: { [Op.like]: `%${q}%` } } : {},
      limit: 10,
    });

    // SECURE: Sanitize search query in response
    ctx.body = {
      success: true,
      searchQuery: q ? escapeHtml(String(q)) : "",
      data: posts.map((post) => ({
        ...post.toJSON(),
        title: escapeHtml(post.title),
        content: escapeHtml(post.content),
      })),
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Sanitized user profile
router.get("/profile/:username", async (ctx) => {
  const { username } = ctx.params;

  // Validate username format
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid username format" };
    return;
  }

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      ctx.status = 404;
      // SECURE: Sanitized error message
      ctx.body = {
        success: false,
        error: `User not found`,
      };
      return;
    }

    ctx.body = {
      success: true,
      data: {
        username: escapeHtml(user.username),
        email: escapeHtml(user.email),
      },
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

export default router;
