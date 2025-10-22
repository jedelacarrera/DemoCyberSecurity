import Router from "@koa/router";
import crypto from "crypto";
import { config } from "../../config";

const router = new Router({ prefix: "/api/secure/deserialization" });

// SECURE: Safe JSON parsing with validation
router.post("/parse-data", async (ctx) => {
  const { data } = ctx.request.body as { data: string };

  if (!data) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Data is required" };
    return;
  }

  try {
    // SECURE: Using JSON.parse (safe) with validation
    const parsed = JSON.parse(data);

    // Validate structure
    if (typeof parsed !== "object" || parsed === null) {
      ctx.status = 400;
      ctx.body = { success: false, error: "Invalid data structure" };
      return;
    }

    // Validate expected fields with whitelist
    const allowedFields = ["name", "value", "type"];
    const validData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (field in parsed) {
        validData[field] = parsed[field];
      }
    }

    ctx.body = {
      success: true,
      data: validData,
      note: "Data validated against schema",
    };
  } catch (error: any) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid JSON" };
  }
});

// SECURE: Session with HMAC signature
router.post("/load-session", async (ctx) => {
  const { sessionData, signature } = ctx.request.body as {
    sessionData: string;
    signature: string;
  };

  if (!sessionData || !signature) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Session data and signature required" };
    return;
  }

  try {
    // SECURE: Verify HMAC signature before deserializing
    const hmac = crypto.createHmac("sha256", config.security.sessionSecret);
    hmac.update(sessionData);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
      ctx.status = 403;
      ctx.body = { success: false, error: "Invalid session signature" };
      return;
    }

    // Now safe to deserialize
    const session = JSON.parse(Buffer.from(sessionData, "base64").toString());

    // Validate session structure
    if (!session.user || !session.user.id || !session.expiresAt) {
      ctx.status = 400;
      ctx.body = { success: false, error: "Invalid session structure" };
      return;
    }

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      ctx.status = 401;
      ctx.body = { success: false, error: "Session expired" };
      return;
    }

    ctx.body = {
      success: true,
      message: "Session loaded securely",
      user: session.user,
      note: "Session validated with HMAC signature",
    };
  } catch (error: any) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid session data" };
  }
});

// SECURE: Schema validation for objects
router.post("/process-object", async (ctx) => {
  const { serializedObj } = ctx.request.body as { serializedObj: string };

  if (!serializedObj) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Object is required" };
    return;
  }

  try {
    const obj = JSON.parse(serializedObj);

    // SECURE: Validate object schema
    const allowedTypes = ["query", "command", "event"];
    const allowedActions = ["create", "read", "update", "delete"];

    if (!obj.type || !allowedTypes.includes(obj.type)) {
      ctx.status = 400;
      ctx.body = { success: false, error: "Invalid object type" };
      return;
    }

    if (!obj.action || !allowedActions.includes(obj.action)) {
      ctx.status = 400;
      ctx.body = { success: false, error: "Invalid action" };
      return;
    }

    // Sanitize and validate data field
    if (typeof obj.data !== "object" || obj.data === null) {
      ctx.status = 400;
      ctx.body = { success: false, error: "Invalid data field" };
      return;
    }

    const result = {
      type: obj.type,
      action: obj.action,
      data: obj.data,
    };

    ctx.body = {
      success: true,
      result,
      note: "Object validated against schema with type checking",
    };
  } catch (error: any) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Invalid JSON" };
  }
});

export default router;
