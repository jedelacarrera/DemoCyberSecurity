import Router from "@koa/router";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = new Router({ prefix: "/api/vulnerable/command-injection" });

// VULNERABLE: Command injection in ping utility
router.get("/ping", async (ctx) => {
  const { host } = ctx.query;

  if (!host) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Host parameter is required" };
    return;
  }

  try {
    // VULNERABILITY: User input directly in system command
    const { stdout, stderr } = await execAsync(`ping -c 3 ${host}`);

    ctx.body = {
      success: true,
      output: stdout,
      error: stderr,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message, output: error.stdout };
  }
});

// VULNERABLE: Command injection in file operations
router.get("/files", async (ctx) => {
  const { path } = ctx.query;

  if (!path) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Path parameter is required" };
    return;
  }

  try {
    // VULNERABILITY: Unsanitized path in ls command
    const { stdout } = await execAsync(`ls -la ${path}`);

    ctx.body = {
      success: true,
      output: stdout,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Command injection in ImageMagick-like scenario
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

  try {
    // VULNERABILITY: Command injection in image conversion
    const { stdout } = await execAsync(
      `echo "Converting ${filename} to ${format}"`
    );

    ctx.body = {
      success: true,
      message: `Image conversion simulated`,
      output: stdout,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;
