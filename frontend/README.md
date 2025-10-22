# OWASP Vulnerabilities Demo - Frontend

Frontend web application for demonstrating OWASP Top 10 vulnerabilities.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **HTTP Client:** Axios

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on port 3001

### Installation

```bash
cd frontend
npm install
```

### Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development

```bash
npm run dev
```

Application will run on http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## Features

### Vulnerability Catalog

- Browse all 13 OWASP vulnerabilities
- View detailed explanations for each
- See code examples (vulnerable vs secure)

### Interactive Demos

- Test vulnerable implementations
- Compare with secure versions
- See real-time API responses
- Understand the differences

### Code Examples

Each vulnerability includes:

- **Vulnerable Code**: Shows the security flaw
- **Secure Code**: Shows the proper implementation
- **Explanation**: Describes the vulnerability
- **Impact**: Lists potential consequences

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   ├── about/
│   │   └── page.tsx         # About page
│   ├── vulnerabilities/
│   │   └── [id]/
│   │       └── page.tsx     # Dynamic vulnerability page
│   └── globals.css          # Global styles
├── components/
│   ├── Navigation.tsx       # Top navigation bar
│   └── VulnerabilityDemo.tsx # Demo component
├── lib/
│   └── api.ts              # API client
├── public/                 # Static assets
├── package.json
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## Available Vulnerabilities

1. SQL Injection
2. Cross-Site Scripting (XSS)
3. Command Injection
4. Broken Access Control
5. Authentication Failures
6. Cryptographic Failures
7. CSRF
8. SSRF
9. Security Misconfiguration
10. Insecure Deserialization
11. Security Logging Failures
12. Secrets Exposure
13. Rate Limiting / DoS

## Security Notice

⚠️ This application is for educational purposes only. Never deploy to production or expose to the internet.

## License

MIT
