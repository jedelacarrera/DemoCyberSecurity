# OWASP Vulnerabilities Demo - Backend

Backend API demonstrating common OWASP Top 10 vulnerabilities and their secure implementations.

## Tech Stack

- **Framework:** Koa
- **Database:** SQLite (in-memory for ephemeral demo data)
- **ORM:** Sequelize
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
cd backend
npm install
```

### Configuration

Copy `env.template` to `.env` and configure:

```bash
cp env.template .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
CORS_ORIGIN=http://localhost:3000
ENABLE_VULNERABLE_ENDPOINTS=true
```

**Note:** No database setup required! The application uses in-memory SQLite and automatically seeds demo data on startup.

### Development

```bash
npm run dev
```

Server will run on http://localhost:3001

### Production Build

```bash
npm run build
npm start
```

## API Structure

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Vulnerabilities

Each vulnerability has two endpoint prefixes:

- `/api/vulnerable/{vulnerability-name}` - Intentionally vulnerable
- `/api/secure/{vulnerability-name}` - Secure implementation

#### Available Vulnerabilities

1. **SQL Injection** (`/sql-injection`)
2. **XSS** (`/xss`)
3. **Command Injection** (`/command-injection`)
4. **Broken Access Control** (`/access-control`)
5. **CSRF** (`/csrf`)
6. **SSRF** (`/ssrf`)
7. **Authentication Failures** (`/auth`)
8. **Sensitive Data** (`/sensitive-data`)
9. **Insecure Deserialization** (`/deserialization`)
10. **Security Misconfiguration** (`/misconfiguration`)
11. **Secrets Exposure** (`/secrets`)
12. **Rate Limiting** (`/rate-limiting`)

## Demo Users

```
Username: admin
Password: admin123
Role: admin

Username: user
Password: user123
Role: user

Username: alice
Password: alice123
Role: user

Username: bob
Password: bob123
Role: user
```

## Security Warning

⚠️ **This application contains intentionally vulnerable code for educational purposes.**

**DO NOT:**

- Deploy to production
- Use in any real application
- Expose to the internet without proper isolation

**The vulnerable endpoints should only be enabled in demo/training environments.**

Set `ENABLE_VULNERABLE_ENDPOINTS=false` in production!

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   │   ├── vulnerable/  # Vulnerable implementations
│   │   └── secure/      # Secure implementations
│   ├── middleware/      # Koa middleware
│   ├── utils/           # Utility functions
│   └── app.ts           # Main application (includes auto-seeding)
├── package.json
└── tsconfig.json
```

## License

MIT
