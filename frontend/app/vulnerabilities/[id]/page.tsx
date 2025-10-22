"use client";

import { use, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Code,
  Play,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";

const vulnerabilityData: Record<string, any> = {
  "sql-injection": {
    title: "SQL Injection",
    description:
      "Inyección de código SQL malicioso en consultas de base de datos",
    category: "A03:2021 - Injection",
    severity: "critical",
    explanation:
      "SQL Injection ocurre cuando datos no confiables son incluidos directamente en consultas SQL sin validación o escape adecuado. Esto permite a atacantes ejecutar comandos SQL arbitrarios.",
    impact: [
      "Acceso no autorizado a datos sensibles",
      "Modificación o eliminación de datos",
      "Bypass de autenticación",
      "Ejecución de comandos administrativos en la base de datos",
    ],
    vulnerableExample: `// VULNERABLE
const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
db.query(query);

// Ataque: username = "admin' OR '1'='1" --"
// Resultado: SELECT * FROM users WHERE username = 'admin' OR '1'='1' -- AND password = ''`,
    secureExample: `// SECURE
const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
db.query(query, [username, password]);

// O usando ORM:
const user = await User.findOne({
  where: { username, password }
});`,
    demoEndpoints: {
      vulnerable: "/api/vulnerable/sql-injection/search",
      secure: "/api/secure/sql-injection/search",
    },
  },
  xss: {
    title: "Cross-Site Scripting (XSS)",
    description: "Inyección de scripts maliciosos en páginas web",
    category: "A03:2021 - Injection",
    severity: "high",
    explanation:
      "XSS permite a atacantes inyectar scripts maliciosos en páginas web vistas por otros usuarios. Esto ocurre cuando la aplicación incluye datos no confiables sin validación o escape adecuado.",
    impact: [
      "Robo de cookies y sesiones",
      "Modificación del contenido de la página",
      "Phishing y redirección a sitios maliciosos",
      "Keylogging y captura de datos del usuario",
    ],
    vulnerableExample: `// VULNERABLE
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// o en el backend:
res.send('<h1>' + userInput + '</h1>');`,
    secureExample: `// SECURE
import { escapeHtml } from './utils';

// Escapar HTML
const safeHtml = escapeHtml(userInput);
<div>{safeHtml}</div>

// O usar React (escapa automáticamente):
<div>{userInput}</div>`,
    demoEndpoints: {
      vulnerable: "/api/vulnerable/xss/posts",
      secure: "/api/secure/xss/posts",
    },
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
    vulnerableExample: `// VULNERABLE
const { exec } = require('child_process');
exec(\`ping -c 3 \${userInput}\`, callback);

// Ataque: userInput = "8.8.8.8; rm -rf /"`,
    secureExample: `// SECURE
// Opción 1: Validar input con whitelist
const isValidIP = /^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/.test(userInput);
if (!isValidIP) throw new Error('Invalid IP');

// Opción 2: Usar APIs en lugar de shell
const { execFile } = require('child_process');
execFile('ping', ['-c', '3', userInput], callback);`,
    demoEndpoints: {
      vulnerable: "/api/vulnerable/command-injection/ping",
      secure: "/api/secure/command-injection/ping",
    },
  },
  "broken-access-control": {
    title: "Broken Access Control",
    description: "Control de acceso inadecuado a recursos protegidos",
    category: "A01:2021 - Broken Access Control",
    severity: "high",
    explanation:
      "Broken Access Control ocurre cuando usuarios pueden acceder a recursos o realizar acciones fuera de sus permisos. Esto incluye IDOR (Insecure Direct Object Reference) y falta de verificación de autorización.",
    impact: [
      "Acceso no autorizado a datos de otros usuarios",
      "Escalación de privilegios",
      "Modificación o eliminación de datos ajenos",
      "Bypass de controles de negocio",
    ],
    vulnerableExample: `// VULNERABLE - No verifica propiedad
app.get('/posts/:id', async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  res.json(post); // Retorna cualquier post!
});`,
    secureExample: `// SECURE - Verifica autorización
app.get('/posts/:id', authMiddleware, async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (post.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(post);
});`,
    demoEndpoints: {
      vulnerable: "/api/vulnerable/access-control/posts",
      secure: "/api/secure/access-control/posts",
    },
  },
  csrf: {
    title: "Cross-Site Request Forgery (CSRF)",
    description: "Ejecución de acciones no autorizadas en nombre del usuario",
    category: "A08:2021 - Integrity Failures",
    severity: "medium",
    explanation:
      "CSRF permite a atacantes forzar a usuarios autenticados a ejecutar acciones no deseadas en aplicaciones web donde están autenticados.",
    impact: [
      "Transferencias de dinero no autorizadas",
      "Cambio de configuraciones de cuenta",
      "Publicación de contenido en nombre del usuario",
      "Eliminación de datos",
    ],
    vulnerableExample: `// VULNERABLE - No valida CSRF token
app.post('/transfer', authMiddleware, (req, res) => {
  transferMoney(req.user.id, req.body.to, req.body.amount);
});

// Ataque: <form action="https://bank.com/transfer" method="POST">
//   <input name="to" value="attacker"/>
//   <input name="amount" value="1000"/>
// </form>`,
    secureExample: `// SECURE - Valida CSRF token
app.post('/transfer', authMiddleware, csrfProtection, (req, res) => {
  if (req.csrfToken() !== req.body.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  transferMoney(req.user.id, req.body.to, req.body.amount);
});`,
    demoEndpoints: {
      vulnerable: "/api/vulnerable/csrf/transfer-money",
      secure: "/api/secure/csrf/transfer-money",
    },
  },
  // Add more vulnerabilities...
};

export default function VulnerabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [mode, setMode] = useState<"vulnerable" | "secure">("vulnerable");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      const endpoint =
        mode === "vulnerable"
          ? vuln.demoEndpoints.vulnerable
          : vuln.demoEndpoints.secure;
      const response = await apiClient.call("GET", endpoint, { query: input });
      setResult(response.data);
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
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{vuln.vulnerableExample}</code>
          </pre>
        </div>

        {/* Secure Code */}
        <div className="card border-2 border-success-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <h3 className="text-lg font-semibold text-success-900">
              Código Seguro
            </h3>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{vuln.secureExample}</code>
          </pre>
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
            <p className="text-xs text-gray-500 mt-1">
              Prueba con:{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">test</code> o{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">
                ' OR '1'='1
              </code>
            </p>
          </div>

          <button
            onClick={handleTest}
            disabled={loading || !input}
            className="btn btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {loading ? "Ejecutando..." : "Ejecutar prueba"}
          </button>

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
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
