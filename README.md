# OWASP Vulnerabilities Demo

A comprehensive educational platform demonstrating the OWASP Top 10 vulnerabilities and their secure implementations.

## 🎯 Overview

This project provides hands-on demonstrations of common web application vulnerabilities, showing both vulnerable and secure implementations side-by-side. It's designed for educational purposes to help developers understand security risks and best practices.

## ⚠️ Security Warning

**IMPORTANT:** This application contains **intentionally vulnerable code** for educational purposes only.

- **DO NOT** deploy to production
- **DO NOT** expose to the internet
- **DO NOT** use in any real application
- Only run in isolated development/training environments

## 📋 Vulnerabilities Covered

Based on OWASP Top 10 2021 + additional security issues:

1. **SQL Injection** - Inyección de código SQL malicioso
2. **Cross-Site Scripting (XSS)** - Inyección de scripts en páginas web
3. **Command Injection** - Ejecución de comandos del sistema
4. **Broken Access Control** - Control de acceso inadecuado
5. **Authentication Failures** - Fallas en autenticación
6. **Cryptographic Failures** - Datos sensibles sin cifrado
7. **CSRF** - Cross-Site Request Forgery
8. **SSRF** - Server-Side Request Forgery
9. **Security Misconfiguration** - Configuraciones inseguras
10. **Insecure Deserialization** - Deserialización insegura
11. **Security Logging Failures** - Logging inadecuado / PII exposure
12. **Secrets Exposure** - Exposición de secretos y credenciales
13. **Rate Limiting / DoS** - Falta de límites de tasa

## 🏗️ Architecture

### Project Structure

```
DemoCyberSecurity/
├── frontend/          # Next.js 14 + React + Tailwind CSS
├── backend/           # Koa + Sequelize + SQLite (in-memory)
├── attacker/          # Static HTML pages for cross-origin attacks
├── terraform/         # GCP infrastructure configuration
├── shared/            # Shared types and utilities
├── docker-compose.yml # Local development setup
└── README.md
```

### Tech Stack

**Frontend:**

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

**Backend:**

- Koa
- Sequelize ORM
- SQLite (in-memory for ephemeral demo data)
- TypeScript

**Infrastructure:**

- Google Cloud Run (scales to zero when unused)
- Google Artifact Registry
- Terraform

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Local Development with Docker

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd DemoCyberSecurity
   ```

2. **Start all services with Docker Compose:**

   ```bash
   docker-compose up
   ```

3. **Access the applications:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Attacker: http://localhost:3002

### Local Development without Docker

#### Backend Setup

```bash
cd backend
npm install

# Configure environment
cp env.template .env
# Edit .env with your settings (database not needed - uses in-memory SQLite)

# Start development server (will auto-seed demo data)
npm run dev
```

#### Frontend Setup

```bash
cd frontend
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start development server
npm run dev
```

#### Attacker Setup

```bash
cd attacker
npm install
npm start
```

## 📚 Usage

### Testing Vulnerabilities

1. Navigate to http://localhost:3000
2. Browse the vulnerability catalog
3. Click on any vulnerability to see:
   - Detailed explanation
   - Code examples (vulnerable vs secure)
   - Interactive demo
4. Toggle between "Vulnerable" and "Secure" modes
5. Test attacks using the interactive forms

### Demo Users

```
Admin:
- Username: admin
- Password: admin123

Regular User:
- Username: user
- Password: user123
```

## 🌐 Deployment to Google Cloud

### Prerequisites

- GCP account with billing enabled
- `gcloud` CLI installed and configured
- Project created in GCP

### Deployment Steps (Opción Recomendada: Cloud Build)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick Start:**

```bash
# 1. Configure GCP (first time only)
chmod +x scripts/*.sh
./scripts/setup-gcp.sh

# 2. Deploy everything
./scripts/deploy.sh
```

### Alternative: Manual Deployment with Terraform

For more control over the infrastructure:

```bash
# 1. Build and push Docker images manually
# 2. Configure Terraform
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Deploy infrastructure
terraform init
terraform plan
terraform apply
```

See [terraform/README.md](terraform/README.md) for detailed Terraform instructions.

## 📖 Educational Content

Each vulnerability includes:

- **Description:** What the vulnerability is
- **Impact:** Potential consequences
- **Vulnerable Code:** Example of insecure implementation
- **Secure Code:** Example of secure implementation
- **Interactive Demo:** Test the vulnerability yourself
- **Prevention Tips:** How to avoid this issue

## 🧪 Testing

### Testing Vulnerable Endpoints

```bash
# SQL Injection
curl "http://localhost:3001/api/vulnerable/sql-injection/search?query=admin'%20OR%20'1'='1"

# XSS
curl -X POST http://localhost:3001/api/vulnerable/xss/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"<script>alert(\"XSS\")</script>"}'

# CSRF
Open http://localhost:3002/csrf-demo.html in your browser
```

### Testing Secure Endpoints

All secure endpoints follow the same paths but use `/api/secure/` instead of `/api/vulnerable/`.

## 🛡️ Security Best Practices Demonstrated

- Input validation and sanitization
- Parameterized queries (prepared statements)
- CSRF token protection
- Rate limiting
- Proper authentication and authorization
- Secure password hashing
- HTTPOnly cookies
- Security headers (CSP, HSTS, etc.)
- Output encoding
- Least privilege principle

## 📝 Documentation

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Terraform README](terraform/README.md)
- [Deployment Guide](DEPLOYMENT.md)

## 🤝 Contributing

This is an educational project. Contributions are welcome!

Please ensure:

- Code is well-documented
- Both vulnerable and secure examples are provided
- UI text is in Spanish
- Code comments are in English

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP Community](https://owasp.org/www-community/)

## ⚖️ Disclaimer

This software is provided for **educational purposes only**. The authors and contributors are not responsible for any misuse or damage caused by this software. Use at your own risk and only in authorized environments.

---

**Remember:** With great power comes great responsibility. Use this knowledge to build more secure applications! 🔒
