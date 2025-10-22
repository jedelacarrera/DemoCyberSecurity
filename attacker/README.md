# Attacker System - Cross-Origin Attack Demonstrations

Simple static HTML pages simulating a malicious website for cross-origin attack demonstrations.

## Purpose

This system runs on a different origin (port 3002) to simulate attacks that originate from external, malicious websites. It demonstrates how attackers can exploit vulnerabilities when proper security measures aren't in place.

## Attacks Included

### 1. CSRF (Cross-Site Request Forgery)

**File:** `csrf-attack.html`

Demonstrates how an attacker site can make authenticated requests on behalf of a logged-in user.

- Auto-submitting forms
- Hidden iframe techniques
- Fetch API with credentials

### 2. Iframe XSS

**File:** `iframe-xss.html`

Shows XSS attacks using iframes and how malicious content can be injected.

- XSS payload examples
- Testing different injection vectors
- Stored XSS demonstrations

### 3. Clickjacking

**File:** `clickjacking.html`

Demonstrates UI redressing attacks where users are tricked into clicking hidden elements.

- Transparent iframe overlay
- Interactive opacity slider
- Visual demonstration

## Running Locally

### With npm

```bash
cd attacker
npm install
npm start
```

Runs on http://localhost:3002

### With Docker

```bash
docker build -t owasp-attacker .
docker run -p 3002:80 owasp-attacker
```

### With Docker Compose

From project root:

```bash
docker-compose up attacker
```

## How to Use

1. Start the backend and frontend applications
2. Log in to the main application (http://localhost:3000)
3. Visit the attacker site (http://localhost:3002)
4. Try different attacks to see how they work

## Attack Scenarios

### CSRF Attack Flow

1. User is authenticated on http://localhost:3001
2. Attacker tricks user to visit http://localhost:3002/csrf-attack.html
3. Page automatically sends malicious request
4. If no CSRF protection, action executes successfully

### XSS Attack Flow

1. Attacker injects malicious script via vulnerable endpoint
2. Script is stored in database
3. When other users view the content, script executes
4. Attacker can steal cookies, sessions, or perform actions

### Clickjacking Flow

1. Attacker creates legitimate-looking page
2. Hidden iframe with victim site overlay
3. User thinks they're clicking on visible content
4. Actually clicking on invisible iframe

## Security Headers to Prevent These Attacks

```
# CSRF
- CSRF tokens
- SameSite cookies

# XSS
- Content-Security-Policy
- X-XSS-Protection
- Input sanitization

# Clickjacking
- X-Frame-Options: DENY
- Content-Security-Policy: frame-ancestors 'none'
```

## Files

```
attacker/
├── public/
│   ├── index.html           # Main dashboard
│   ├── csrf-attack.html     # CSRF demonstration
│   ├── iframe-xss.html      # XSS demonstration
│   ├── clickjacking.html    # Clickjacking demonstration
│   └── styles.css           # Shared styles
├── package.json
├── Dockerfile
└── README.md
```

## Warning

⚠️ **This is for educational purposes only!**

- Only use in isolated environments
- Never use these techniques on real websites
- Always get proper authorization before security testing

## License

MIT
