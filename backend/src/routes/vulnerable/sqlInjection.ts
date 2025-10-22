import Router from "@koa/router";
import { sequelize, User, Post } from "../../models";

const router = new Router({ prefix: "/api/vulnerable/sql-injection" });

// VULNERABLE: SQL Injection in search
router.get("/search", async (ctx) => {
  const { query } = ctx.query;

  if (!query) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Query parameter is required" };
    return;
  }

  try {
    // VULNERABILITY: Direct string concatenation in SQL query
    const [results] = await sequelize.query(
      `SELECT * FROM users WHERE username LIKE '%${query}%' OR email LIKE '%${query}%'`
    );

    ctx.body = {
      success: true,
      data: results,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: SQL Injection in login
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
    // VULNERABILITY: SQL injection in WHERE clause
    const [results] = await sequelize.query(
      `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
    );

    if (Array.isArray(results) && results.length > 0) {
      ctx.body = {
        success: true,
        message: "Login successful",
        data: results[0],
      };
    } else {
      ctx.status = 401;
      ctx.body = { success: false, error: "Invalid credentials" };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: SQL Injection in post retrieval
router.get("/posts/:id", async (ctx) => {
  const { id } = ctx.params;

  try {
    // VULNERABILITY: Unsanitized parameter in SQL query
    const [results] = await sequelize.query(
      `SELECT posts.*, users.username FROM posts 
       JOIN users ON posts."userId" = users.id 
       WHERE posts.id = ${id}`
    );

    if (Array.isArray(results) && results.length > 0) {
      ctx.body = { success: true, data: results[0] };
    } else {
      ctx.status = 404;
      ctx.body = { success: false, error: "Post not found" };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;
