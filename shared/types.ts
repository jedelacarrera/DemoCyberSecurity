// Shared TypeScript types for the OWASP Vulnerabilities Demo

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string; // Not included in API responses
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: number;
  userId: number;
  token: string;
  data: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: number;
  action: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface VulnerabilityInfo {
  id: string;
  title: string;
  description: string;
  owaspCategory: string;
  severity: "critical" | "high" | "medium" | "low";
}

export const vulnerabilities: VulnerabilityInfo[] = [
  {
    id: "sql-injection",
    title: "SQL Injection",
    description: "Inyección de código SQL malicioso en consultas",
    owaspCategory: "A03:2021 - Injection",
    severity: "critical",
  },
  {
    id: "xss",
    title: "Cross-Site Scripting (XSS)",
    description: "Inyección de scripts maliciosos en páginas web",
    owaspCategory: "A03:2021 - Injection",
    severity: "high",
  },
  {
    id: "command-injection",
    title: "Command Injection",
    description: "Ejecución de comandos del sistema operativo",
    owaspCategory: "A03:2021 - Injection",
    severity: "critical",
  },
  {
    id: "broken-access-control",
    title: "Broken Access Control",
    description: "Control de acceso inadecuado a recursos",
    owaspCategory: "A01:2021 - Broken Access Control",
    severity: "high",
  },
  {
    id: "authentication-failures",
    title: "Authentication Failures",
    description: "Fallas en autenticación y gestión de sesiones",
    owaspCategory: "A07:2021 - Identification and Authentication Failures",
    severity: "high",
  },
  {
    id: "sensitive-data",
    title: "Cryptographic Failures",
    description: "Exposición de datos sensibles sin cifrado",
    owaspCategory: "A02:2021 - Cryptographic Failures",
    severity: "high",
  },
  {
    id: "csrf",
    title: "Cross-Site Request Forgery (CSRF)",
    description: "Ejecución de acciones no autorizadas en nombre del usuario",
    owaspCategory: "A08:2021 - Software and Data Integrity Failures",
    severity: "medium",
  },
  {
    id: "ssrf",
    title: "Server-Side Request Forgery (SSRF)",
    description: "Servidor realiza peticiones a recursos no autorizados",
    owaspCategory: "A10:2021 - Server-Side Request Forgery",
    severity: "high",
  },
  {
    id: "security-misconfiguration",
    title: "Security Misconfiguration",
    description: "Configuraciones de seguridad incorrectas",
    owaspCategory: "A05:2021 - Security Misconfiguration",
    severity: "medium",
  },
  {
    id: "insecure-deserialization",
    title: "Insecure Deserialization",
    description: "Deserialización insegura de datos",
    owaspCategory: "A08:2021 - Software and Data Integrity Failures",
    severity: "high",
  },
  {
    id: "logging-failures",
    title: "Security Logging and Monitoring Failures",
    description: "Logging inadecuado y exposición de PII en logs",
    owaspCategory: "A09:2021 - Security Logging and Monitoring Failures",
    severity: "medium",
  },
  {
    id: "secrets-exposure",
    title: "Secrets Exposure",
    description: "Exposición de secretos y credenciales",
    owaspCategory: "A02:2021 - Cryptographic Failures",
    severity: "critical",
  },
  {
    id: "rate-limiting",
    title: "Rate Limiting / DoS Lógico",
    description:
      "Falta de límites de tasa permite ataques de denegación de servicio",
    owaspCategory: "A05:2021 - Security Misconfiguration",
    severity: "medium",
  },
];
