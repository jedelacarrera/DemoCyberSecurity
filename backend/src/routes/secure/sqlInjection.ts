import Router from "@koa/router";
import { Op } from "sequelize";
import { sequelize, User, Post } from "../../models";

const router = new Router({ prefix: "/api/secure/sql-injection" });

// SECURE: Parameterized query for search
router.get("/search", async (ctx) => {
  const { query } = ctx.query;

  if (!query || typeof query !== "string") {
    ctx.status = 400;
    ctx.body = { success: false, error: "Query parameter is required" };
    return;
  }

  try {
    // SECURE: Using Sequelize ORM with parameterized queries
    const results = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
        ],
      },
      attributes: ["id", "username", "email", "role", "createdAt"],
    });

    ctx.body = {
      success: true,
      data: results,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Parameterized query for login (though still not recommended approach)
router.post("/login", async (ctx) => {
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
    // SECURE: Using prepared statements
    const [results] = await sequelize.query(
      "SELECT * FROM users WHERE username = :username",
      {
        replacements: { username },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (results && typeof results === "object") {
      ctx.body = {
        success: true,
        message: "User found (password validation would happen here)",
        data: { username: (results as any).username },
      };
    } else {
      ctx.status = 401;
      ctx.body = { success: false, error: "Invalid credentials" };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Parameterized query for post retrieval
router.get("/posts/:id", async (ctx) => {
  const { id } = ctx.params;

  // Validate that id is a number
  if (!/^\d+$/.test(id)) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid post ID" };
    return;
  }

  try {
    // SECURE: Using Sequelize ORM
    const post = await Post.findByPk(parseInt(id), {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
        },
      ],
    });

    if (post) {
      ctx.body = { success: true, data: post };
    } else {
      ctx.status = 404;
      ctx.body = { success: false, error: "Post not found" };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

export default router;
