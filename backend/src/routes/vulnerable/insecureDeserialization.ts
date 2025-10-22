import Router from "@koa/router";

const router = new Router({ prefix: "/api/vulnerable/deserialization" });

// VULNERABLE: Unsafe JSON parsing with eval
router.post("/parse-data", async (ctx) => {
  const { data } = ctx.request.body as { data: string };

  if (!data) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Data is required" };
    return;
  }

  try {
    // VULNERABILITY: Using eval for deserialization
    // const parsed = eval('(' + data + ')'); // Extremely dangerous!

    // Simulating unsafe deserialization
    const parsed = JSON.parse(data);

    ctx.body = {
      success: true,
      data: parsed,
      warning: "This endpoint uses unsafe deserialization practices!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Deserializing user session without validation
router.post("/load-session", async (ctx) => {
  const { sessionData } = ctx.request.body as { sessionData: string };

  if (!sessionData) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Session data is required" };
    return;
  }

  try {
    // VULNERABILITY: No validation of deserialized data
    const session = JSON.parse(Buffer.from(sessionData, "base64").toString());

    // Directly using deserialized data without validation
    ctx.state.user = session.user;

    ctx.body = {
      success: true,
      message: "Session loaded",
      user: session.user,
      warning: "Session data accepted without validation!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// VULNERABLE: Accepting serialized objects
router.post("/process-object", async (ctx) => {
  const { serializedObj } = ctx.request.body as { serializedObj: string };

  if (!serializedObj) {
    ctx.status = 400;
    ctx.body = { success: false, error: "Object is required" };
    return;
  }

  try {
    // VULNERABILITY: Trusting serialized data
    const obj = JSON.parse(serializedObj);

    // Using object properties without validation
    const result = {
      type: obj.type,
      action: obj.action,
      data: obj.data,
      // Could execute arbitrary code if not validated
    };

    ctx.body = {
      success: true,
      result,
      warning: "Object deserialized without type/schema validation!",
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

export default router;
