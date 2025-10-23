import Router from "@koa/router";

const router = new Router({ prefix: "/api/vulnerable/misconfiguration" });

// VULNERABLE: Detailed error messages
router.get("/error-example", async (ctx) => {
  try {
    throw new Error(
      "Database connection failed at host: db.internal.company.com:5432 with user: admin"
    );
  } catch (error: any) {
    // VULNERABILITY: Exposing internal details in error messages
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message,
      stack: error.stack, // CRITICAL: Exposing stack trace
      config: {
        dbHost: "db.internal.company.com",
        dbPort: 5432,
      },
      warning: "This exposes internal configuration!",
    };
  }
});

// VULNERABLE: Directory listing
router.get("/files", async (ctx) => {
  // VULNERABILITY: Exposing directory structure
  const fileList = [
    ".env",
    "config.json",
    "database.sql",
    "backup.tar.gz",
    "private_keys/",
    "node_modules/",
  ];

  ctx.body = {
    success: true,
    files: fileList,
    warning: "Exposing sensitive files and directory structure!",
  };
});

// VULNERABLE: Default credentials
router.post("/admin-login", async (ctx) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  // VULNERABILITY: Default credentials not changed
  if (username === "admin" && password === "admin") {
    ctx.body = {
      success: true,
      message: "Admin access granted",
      warning: "Using default credentials!",
    };
  } else {
    ctx.status = 401;
    ctx.body = { success: false, error: "Invalid credentials" };
  }
});

// VULNERABLE: Debug mode enabled
router.get("/debug-info", async (ctx) => {
  // VULNERABILITY: Debug endpoint exposed in production
  ctx.body = {
    success: true,
    debug: {
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      env: process.env, // CRITICAL: Exposing all environment variables!
      cwd: process.cwd(),
      execPath: process.execPath,
    },
    warning: "Debug endpoint exposing sensitive system information!",
  };
});

// VULNERABLE: Unnecessary HTTP methods
router.all("/resource", async (ctx) => {
  // VULNERABILITY: Allowing TRACE, OPTIONS, etc. unnecessarily
  ctx.body = {
    success: true,
    method: ctx.method,
    message: `${ctx.method} method is allowed`,
    warning: "Unnecessary HTTP methods enabled!",
  };
});

// VULNERABLE: No security headers
router.get("/insecure-page", async (ctx) => {
  // VULNERABILITY: Missing security headers
  // No CSP, no HSTS, no X-Frame-Options, etc.

  ctx.type = "text/html";
  ctx.body = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Vulnerable Banking Site</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }
        .panel {
          background: white;
          color: #333;
          padding: 30px;
          border-radius: 10px;
          max-width: 400px;
          margin: 50px auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 16px;
          border-radius: 5px;
          cursor: pointer;
          margin: 10px;
          transition: all 0.3s;
        }
        button:hover {
          background: #764ba2;
          transform: scale(1.05);
        }
        .danger {
          background: #f44336;
        }
        .danger:hover {
          background: #d32f2f;
        }
        .balance {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="panel">
        <h1>🏦 Banco Online</h1>
        <p>Bienvenido, <strong>Usuario</strong></p>
        <div class="balance">$10,000.00</div>
        <p>Balance de cuenta</p>
        <button onclick="alert('✅ Transferencia de $100 realizada')">Transferir $100</button>
        <button class="danger" onclick="alert('⚠️ ¡Cuenta eliminada!')">Eliminar Cuenta</button>
      </div>
      <p style="margin-top: 20px; font-size: 12px;">⚠️ Esta página es vulnerable a Clickjacking (Sin X-Frame-Options)</p>
    </body>
    </html>
  `;
});

// VULNERABLE: CORS misconfiguration
router.get("/cors-any", async (ctx) => {
  // VULNERABILITY: Allowing any origin
  ctx.set("Access-Control-Allow-Origin", "*");
  ctx.set("Access-Control-Allow-Credentials", "true");

  ctx.body = {
    success: true,
    data: { sensitive: "information" },
    warning: "CORS allows any origin with credentials!",
  };
});

export default router;
