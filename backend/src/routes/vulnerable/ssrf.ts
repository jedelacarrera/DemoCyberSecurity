import Router from "@koa/router";
import fetch from "node-fetch";

const router = new Router({ prefix: "/api/vulnerable/ssrf" });

// VULNERABLE: SSRF via image fetch
router.post("/fetch-image", async (ctx) => {
  const { url } = ctx.request.body as { url: string };

  if (!url) {
    ctx.status = 400;
    ctx.body = { success: false, error: "URL is required" };
    return;
  }

  try {
    // VULNERABILITY: No validation of URL - can access internal resources
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");

    ctx.body = {
      success: true,
      message: `Fetched content from ${url}`,
      contentType,
      status: response.status,
      warning: "This endpoint is vulnerable to SSRF!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: SSRF via webhook
router.post("/webhook", async (ctx) => {
  const { callbackUrl, data } = ctx.request.body as {
    callbackUrl: string;
    data: any;
  };

  if (!callbackUrl) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Callback URL is required" };
    return;
  }

  try {
    // VULNERABILITY: Can be used to scan internal network
    const response = await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });

    ctx.body = {
      success: true,
      message: "Webhook called",
      status: response.status,
      warning: "This endpoint is vulnerable to SSRF!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: SSRF via PDF generator
router.post("/generate-pdf", async (ctx) => {
  const { htmlUrl } = ctx.request.body as { htmlUrl: string };

  if (!htmlUrl) {
    ctx.status = 400;
    ctx.body = { success: false, error: "HTML URL is required" };
    return;
  }

  try {
    // VULNERABILITY: Fetches arbitrary URL to "convert" to PDF
    const response = await fetch(htmlUrl);
    const html = await response.text();

    ctx.body = {
      success: true,
      message: "PDF generation simulated",
      htmlLength: html.length,
      warning: "This endpoint is vulnerable to SSRF!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;
