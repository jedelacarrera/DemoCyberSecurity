import { Shield, Target, Code, BookOpen } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Acerca del Proyecto
        </h1>

        <div className="card mb-6">
          <p className="text-lg text-gray-700 leading-relaxed">
            OWASP Vulnerabilities Demo es una plataforma educativa diseñada para
            enseñar sobre vulnerabilidades web comunes y cómo prevenirlas
            siguiendo las mejores prácticas de seguridad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <Target className="w-10 h-10 text-primary-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Objetivo
            </h2>
            <p className="text-gray-600">
              Proporcionar un entorno seguro para aprender sobre
              vulnerabilidades web mediante ejemplos prácticos de código
              vulnerable y su versión segura.
            </p>
          </div>

          <div className="card">
            <Code className="w-10 h-10 text-primary-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Metodología
            </h2>
            <p className="text-gray-600">
              Cada vulnerabilidad incluye dos implementaciones: una vulnerable y
              otra segura, permitiendo comparar y entender las diferencias.
            </p>
          </div>

          <div className="card">
            <BookOpen className="w-10 h-10 text-primary-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              OWASP Top 10
            </h2>
            <p className="text-gray-600">
              Basado en el OWASP Top 10 2021, cubre las vulnerabilidades más
              críticas y comunes en aplicaciones web modernas.
            </p>
          </div>

          <div className="card">
            <Shield className="w-10 h-10 text-primary-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Buenas Prácticas
            </h2>
            <p className="text-gray-600">
              Cada ejemplo seguro implementa las mejores prácticas de la
              industria para mitigar efectivamente cada tipo de vulnerabilidad.
            </p>
          </div>
        </div>

        <div className="card bg-primary-50 border-primary-200 mb-6">
          <h2 className="text-2xl font-semibold text-primary-900 mb-4">
            Stack Tecnológico
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-primary-800 mb-2">Frontend</h3>
              <ul className="space-y-1 text-sm">
                <li>• Next.js 14 (App Router)</li>
                <li>• React 18</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary-800 mb-2">Backend</h3>
              <ul className="space-y-1 text-sm">
                <li>• Koa</li>
                <li>• Sequelize ORM</li>
                <li>• PostgreSQL</li>
                <li>• TypeScript</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card bg-danger-50 border-danger-200">
          <h2 className="text-xl font-semibold text-danger-900 mb-3">
            ⚠️ Advertencia Importante
          </h2>
          <div className="text-danger-800 space-y-2 text-sm">
            <p>
              Este proyecto contiene{" "}
              <strong>código intencionalmente vulnerable</strong> con fines
              educativos exclusivamente.
            </p>
            <p className="font-semibold">
              NUNCA uses este código en producción o en cualquier entorno
              accesible desde Internet.
            </p>
            <p>
              Los endpoints vulnerables están claramente marcados y deben usarse
              únicamente en entornos de desarrollo aislados y controlados.
            </p>
          </div>
        </div>

        <div className="card mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Recursos Adicionales
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <a
                href="https://owasp.org/www-project-top-ten/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                OWASP Top 10 2021
              </a>
            </li>
            <li>
              <a
                href="https://cheatsheetseries.owasp.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                OWASP Cheat Sheet Series
              </a>
            </li>
            <li>
              <a
                href="https://owasp.org/www-community/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                OWASP Community
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
