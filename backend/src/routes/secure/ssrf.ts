import Router from "@koa/router";
import fetch from "node-fetch";
import { URL } from "url";

const router = new Router({ prefix: "/api/secure/ssrf" });

// Whitelist of allowed domains
const ALLOWED_DOMAINS = [
  "example.com",
  "api.example.com",
  "images.example.com",
];

// Blacklist of internal/private IP ranges
const isPrivateIP = (hostname: string): boolean => {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
    /localhost/i,
  ];

  return privateRanges.some((range) => range.test(hostname));
};

// SECURE: URL validation for image fetch
router.post("/fetch-image", async (ctx) => {
  const { url } = ctx.request.body as { url: string };

  if (!url) {
    ctx.status = 400;
    ctx.body = { success: false, error: "URL is required" };
    return;
  }

  try {
    // SECURE: Parse and validate URL
    const parsedUrl = new URL(url);

    // Check protocol
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "Only HTTP/HTTPS protocols are allowed",
      };
      return;
    }

    // Check against private IPs
    if (isPrivateIP(parsedUrl.hostname)) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error: "Access to internal resources is forbidden",
      };
      return;
    }

    // Check domain whitelist
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      ctx.status = 403;
      ctx.body = { success: false, error: "Domain not in whitelist" };
      return;
    }

    const response = await fetch(url, {
      timeout: 5000,
      redirect: "manual", // Don't follow redirects (could lead to SSRF)
    });

    const contentType = response.headers.get("content-type");

    // Verify it's actually an image
    if (!contentType?.startsWith("image/")) {
      ctx.status = 400;
      ctx.body = { success: false, error: "URL does not point to an image" };
      return;
    }

    ctx.body = {
      success: true,
      message: `Fetched image from ${url}`,
      contentType,
      note: "URL validated against whitelist and private IP ranges",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: Validated webhook
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
    const parsedUrl = new URL(callbackUrl);

    // Validate protocol
    if (!["https:"].includes(parsedUrl.protocol)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "Only HTTPS protocol is allowed for webhooks",
      };
      return;
    }

    // Check against private IPs
    if (isPrivateIP(parsedUrl.hostname)) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error: "Webhooks to internal resources are forbidden",
      };
      return;
    }

    // Domain whitelist check
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      ctx.status = 403;
      ctx.body = { success: false, error: "Webhook domain not in whitelist" };
      return;
    }

    const response = await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
      timeout: 5000,
      redirect: "manual",
    });

    ctx.body = {
      success: true,
      message: "Webhook called securely",
      status: response.status,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: "Internal server error" };
  }
});

// SECURE: PDF generator with validation
router.post("/generate-pdf", async (ctx) => {
  const { htmlUrl } = ctx.request.body as { htmlUrl: string };

  if (!htmlUrl) {
    ctx.status = 400;
    ctx.body = { success: false, error: "HTML URL is required" };
    return;
  }

  try {
    const parsedUrl = new URL(htmlUrl);

    // Security checks
    if (!["https:"].includes(parsedUrl.protocol)) {
      ctx.status = 400;
      ctx.body = { success: false, error: "Only HTTPS protocol is allowed" };
      return;
    }

    if (isPrivateIP(parsedUrl.hostname)) {
      ctx.status = 403;
      ctx.body = { success: false, error: "Cannot access internal resources" };
      return;
    }

    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      ctx.status = 403;
      ctx.body = { success: false, error: "Domain not in whitelist" };
      return;
    }

    ctx.body = {
      success: true,
      message: "PDF generation would proceed with validated URL",
      note: "URL validated for security",
    };
  } catch (error: any) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid URL" };
  }
});

export default router;
