import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OWASP Vulnerabilities Demo",
  description: "Demostración de vulnerabilidades OWASP Top 10 y sus soluciones",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <footer className="bg-gray-800 text-white py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-gray-400">
              ⚠️ Este proyecto contiene código vulnerable con fines educativos.
              No usar en producción.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              OWASP Vulnerabilities Demo © 2024
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
