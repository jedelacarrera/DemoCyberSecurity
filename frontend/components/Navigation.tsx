"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Home, BookOpen, Github } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="w-8 h-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
            <span className="font-bold text-xl text-gray-900">OWASP Demo</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isActive("/")
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Inicio</span>
            </Link>

            <Link
              href="/about"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isActive("/about")
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">Acerca de</span>
            </Link>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="font-medium">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
