import Link from "next/link";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

const vulnerabilities = [
  {
    id: "sql-injection",
    title: "SQL Injection",
    description:
      "Inyección de código SQL malicioso en consultas de base de datos",
    category: "A03:2021 - Injection",
    severity: "critical",
  },
  {
    id: "xss",
    title: "Cross-Site Scripting (XSS)",
    description: "Inyección de scripts maliciosos en páginas web",
    category: "A03:2021 - Injection",
    severity: "high",
  },
  {
    id: "command-injection",
    title: "Command Injection",
    description: "Ejecución de comandos del sistema operativo",
    category: "A03:2021 - Injection",
    severity: "critical",
  },
  {
    id: "broken-access-control",
    title: "Broken Access Control",
    description: "Control de acceso inadecuado a recursos protegidos",
    category: "A01:2021 - Broken Access Control",
    severity: "high",
  },
  {
    id: "authentication-failures",
    title: "Authentication Failures",
    description: "Fallas en autenticación y gestión de sesiones",
    category: "A07:2021 - Authentication Failures",
    severity: "high",
  },
  {
    id: "sensitive-data",
    title: "Cryptographic Failures",
    description: "Exposición de datos sensibles sin cifrado adecuado",
    category: "A02:2021 - Cryptographic Failures",
    severity: "high",
  },
  {
    id: "csrf",
    title: "Cross-Site Request Forgery (CSRF)",
    description: "Ejecución de acciones no autorizadas en nombre del usuario",
    category: "A08:2021 - Integrity Failures",
    severity: "medium",
  },
  {
    id: "ssrf",
    title: "Server-Side Request Forgery (SSRF)",
    description: "Servidor realiza peticiones a recursos no autorizados",
    category: "A10:2021 - SSRF",
    severity: "high",
  },
  {
    id: "security-misconfiguration",
    title: "Security Misconfiguration",
    description: "Configuraciones de seguridad incorrectas o por defecto",
    category: "A05:2021 - Security Misconfiguration",
    severity: "medium",
  },
  {
    id: "insecure-deserialization",
    title: "Insecure Deserialization",
    description: "Deserialización insegura de datos no confiables",
    category: "A08:2021 - Integrity Failures",
    severity: "high",
  },
  {
    id: "logging-failures",
    title: "Security Logging Failures",
    description: "Logging inadecuado y exposición de PII en logs",
    category: "A09:2021 - Logging Failures",
    severity: "medium",
  },
  {
    id: "secrets-exposure",
    title: "Secrets Exposure",
    description: "Exposición de secretos, API keys y credenciales",
    category: "A02:2021 - Cryptographic Failures",
    severity: "critical",
  },
  {
    id: "rate-limiting",
    title: "Rate Limiting / DoS Lógico",
    description: "Falta de límites de tasa permite ataques DoS",
    category: "A05:2021 - Security Misconfiguration",
    severity: "medium",
  },
];

const severityColors = {
  critical: "bg-danger-100 text-danger-800 border-danger-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-blue-100 text-blue-800 border-blue-300",
};

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <Shield className="w-12 h-12 text-primary-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            OWASP Vulnerabilities Demo
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Plataforma educativa para aprender sobre vulnerabilidades web comunes
          y cómo prevenirlas
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-danger-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Vulnerable</span>
          </div>
          <span className="text-gray-400">vs</span>
          <div className="flex items-center gap-2 text-success-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Seguro</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">13</div>
          <div className="text-gray-600">Vulnerabilidades</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-success-600 mb-2">26</div>
          <div className="text-gray-600">Ejemplos de Código</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">OWASP</div>
          <div className="text-gray-600">Top 10 2021</div>
        </div>
      </div>

      {/* Vulnerabilities Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Catálogo de Vulnerabilidades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vulnerabilities.map((vuln) => (
            <Link
              key={vuln.id}
              href={`/vulnerabilities/${vuln.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {vuln.title}
                </h3>
                <span
                  className={`badge ${
                    severityColors[vuln.severity as keyof typeof severityColors]
                  } border`}
                >
                  {vuln.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{vuln.description}</p>
              <div className="text-xs text-gray-500 font-medium">
                {vuln.category}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Warning Banner */}
      <div className="card bg-danger-50 border-danger-200">
        <div className="flex gap-4">
          <AlertTriangle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-danger-900 mb-2">
              ⚠️ Advertencia de Seguridad
            </h3>
            <p className="text-danger-800 text-sm">
              Este proyecto contiene código{" "}
              <strong>intencionalmente vulnerable</strong> con fines educativos.
              NO uses este código en producción. Los endpoints vulnerables están
              claramente marcados y deben usarse únicamente en entornos de
              desarrollo aislados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
