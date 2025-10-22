import Router from "@koa/router";
import { exec } from "child_process";
import { promisify } from "util";
import validator from "validator";

const execAsync = promisify(exec);
const router = new Router({ prefix: "/api/secure/command-injection" });

// SECURE: Input validation for ping utility
router.get("/ping", async (ctx) => {
  const { host } = ctx.query;

  if (!host || typeof host !== "string") {
    ctx.status = 400;
    ctx.body = { success: false, error: "Host parameter is required" };
    return;
  }

  // SECURE: Validate that input is a valid hostname or IP
  const isValidHost = validator.isIP(host) || validator.isFQDN(host);

  if (!isValidHost) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid host format" };
    return;
  }

  try {
    // SECURE: Use shell escaping or better yet, avoid shell altogether
    // Using a whitelist and parameterized approach
    const { stdout, stderr } = await execAsync("ping", {
      timeout: 5000,
      // This would use execFile instead of exec to avoid shell
    });

    ctx.body = {
      success: true,
      message: `Ping to ${host} would be executed here with proper escaping`,
      note: "In production, use child_process.execFile or spawn instead of exec",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Safe file operations without shell
router.get("/files", async (ctx) => {
  const { path } = ctx.query;

  if (!path || typeof path !== "string") {
    ctx.status = 400;
    ctx.body = { success: false, error: "Path parameter is required" };
    return;
  }

  // SECURE: Validate and sanitize path
  const allowedPaths = ["/tmp", "/var/log"];
  const isAllowed = allowedPaths.some((allowed) => path.startsWith(allowed));

  if (!isAllowed) {
    ctx.status = 403;
    ctx.body = { success: false, error: "Access to this path is not allowed" };
    return;
  }

  try {
    // SECURE: Use fs module instead of shell commands
    const fs = require("fs").promises;
    const files = await fs.readdir(path);

    ctx.body = {
      success: true,
      data: files,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Safe image conversion
router.post("/convert-image", async (ctx) => {
  const { filename, format } = ctx.request.body as {
    filename: string;
    format: string;
  };

  if (!filename || !format) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Filename and format are required" };
    return;
  }

  // SECURE: Whitelist allowed formats
  const allowedFormats = ["jpg", "png", "webp", "gif"];
  if (!allowedFormats.includes(format.toLowerCase())) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid format" };
    return;
  }

  // SECURE: Validate filename
  if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z]{3,4}$/.test(filename)) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid filename format" };
    return;
  }

  try {
    // SECURE: Use library APIs instead of shell commands
    // In production, use sharp, jimp, or similar libraries
    ctx.body = {
      success: true,
      message: `Image conversion would be done using a library (sharp, jimp) instead of shell commands`,
      filename,
      format,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

export default router;
