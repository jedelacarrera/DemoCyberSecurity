# 🔐 Referencia Rápida: Secrets Exposure

## 📋 ¿Qué es Secrets Exposure?

**Secrets Exposure** ocurre cuando información sensible (credenciales, API keys, tokens, passwords, certificados) es expuesta accidentalmente a través de:

- **💻 Código fuente**: Hardcodeado en archivos `.js`, `.ts`, `.py`, etc.
- **🗂️ Repositorios Git**: Archivos `.env` commitidos accidentalmente
- **📝 Logs**: Credenciales impresas en logs del servidor
- **📡 Respuestas HTTP**: Secretos en JSON responses o headers
- **❌ Mensajes de error**: Stack traces con API keys o passwords
- **👨‍💻 Código del cliente**: Secretos en JavaScript frontend

---

## 🎯 ¿Qué son los "Secretos"?

| Tipo de Secreto                 | Ejemplo                                   | Riesgo si se expone                    |
| ------------------------------- | ----------------------------------------- | -------------------------------------- |
| **Database Password**           | `postgres://user:SuperSecret123!@host/db` | Acceso completo a base de datos        |
| **API Keys**                    | `sk_live_1234567890abcdef`                | Uso de servicios → facturas enormes    |
| **JWT Secret**                  | `my-super-secret-jwt-key`                 | Falsificar tokens de cualquier usuario |
| **AWS Access Keys**             | `AKIAIOSFODNN7EXAMPLE`                    | Control total de infraestructura cloud |
| **Private Keys**                | `-----BEGIN PRIVATE KEY-----`             | Descifrar comunicaciones, SSH access   |
| **OAuth Client Secrets**        | `gho_1234567890abcdefghijklmnopqrst`      | Acceso a cuentas de terceros           |
| **SMTP Credentials**            | `smtp://user:pass@smtp.gmail.com`         | Envío de spam masivo                   |
| **Encryption Keys**             | `aes256-gcm-key-32-bytes`                 | Descifrar datos sensibles              |
| **API Tokens (Stripe, OpenAI)** | `sk_test_51Hxx...`                        | Acceso a servicios pagados             |

---

## 🎯 Cómo Ocurre la Exposición

### 1. 🔴 Hardcoded en Código

**Vulnerable**:

```typescript
// backend/config.ts
const DB_PASSWORD = "SuperSecret123!"; // 🔴 HARDCODED
const API_KEY = "sk_live_1234567890abcdef"; // 🔴 HARDCODED
const JWT_SECRET = "my-super-secret-key"; // 🔴 HARDCODED

export const config = {
  database: {
    host: "db.example.com",
    password: DB_PASSWORD, // 🔴 Cualquiera con acceso al código lo ve
  },
  stripe: {
    apiKey: API_KEY, // 🔴 En el repositorio público
  },
  jwt: {
    secret: JWT_SECRET, // 🔴 En el historial de git
  },
};
```

**Impacto**:

- Cualquier desarrollador con acceso al código ve los secretos
- Si el repositorio es público → TODO Internet puede verlos
- Historial de git conserva secretos incluso después de eliminarlos

### 2. 🔴 Commitidos a Git

```bash
# .env file (ACCIDENTALMENTE COMMITIDO)
DATABASE_URL=postgresql://admin:SuperSecret123!@db.internal.com:5432/prod
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_API_KEY=sk_live_1234567890abcdef
JWT_SECRET=my-super-secret-jwt-key
SENDGRID_API_KEY=SG.1234567890abcdefghijklmnopqrstuvwxyz
```

```bash
# Historial de git
$ git log --all --full-history -- .env
commit abc123: Added .env file  # 🔴 Secretos expuestos PARA SIEMPRE
```

**Impacto**:

- Incluso si borras el archivo, permanece en el historial de git
- Bots escanean GitHub/GitLab buscando patrones de API keys
- En minutos, atacantes pueden clonar tu repo y extraer secretos

### 3. 🔴 Expuestos en Respuestas HTTP

**Vulnerable**:

```typescript
router.get("/config", async (ctx) => {
  ctx.body = {
    database: {
      host: "db.example.com",
      username: "admin",
      password: "SuperSecret123!", // 🔴 En la respuesta JSON
    },
    apiKeys: {
      stripe: "sk_live_1234567890abcdef", // 🔴 Visible en DevTools
      aws: "AKIAIOSFODNN7EXAMPLE", // 🔴 Cualquiera puede copiarlo
    },
    jwtSecret: "my-super-secret-jwt-key", // 🔴 Ahora pueden falsificar tokens
  };
});
```

**Ataque**:

```bash
# Cualquier usuario puede obtener los secretos
curl https://api.example.com/config

# O desde el navegador (F12 → Network)
# Todos los secretos visibles en DevTools
```

### 4. 🔴 Loggeados en Consola

**Vulnerable**:

```typescript
router.post("/login", async (ctx) => {
  const { username, password } = ctx.request.body;

  // 🔴 VULNERABILITY: Password en logs
  console.log(`Login attempt: ${username}:${password}`);

  // 🔴 VULNERABILITY: Query string con secretos
  console.log(`Connecting to: postgresql://admin:${DB_PASSWORD}@db.com/prod`);

  const user = await User.findOne({ where: { username } });

  if (user && (await user.validatePassword(password))) {
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    // 🔴 VULNERABILITY: Token en logs
    console.log(`Generated token: ${token}`);

    ctx.body = { success: true, token };
  }
});
```

**Impacto**:

- Logs son almacenados (CloudWatch, Papertrail, Loggly)
- Desarrolladores/DevOps pueden ver passwords de usuarios
- Si logs se filtran → miles de passwords comprometidos

### 5. 🔴 Enviados al Frontend

**Vulnerable**:

```typescript
// backend/api/config.ts
router.get("/client-config", async (ctx) => {
  ctx.body = {
    apiEndpoint: "https://api.example.com",
    stripeKey: "sk_live_1234567890abcdef", // 🔴 SECRET key (no public)
    apiKey: "secret-api-key-12345", // 🔴 Visible en JavaScript
    encryptionKey: "aes-256-secret-key", // 🔴 Visible en bundle.js
  };
});
```

```javascript
// frontend/config.js
const config = await fetch("/api/client-config").then((r) => r.json());

// 🔴 Ahora el atacante abre DevTools y ve:
console.log(config.stripeKey); // sk_live_1234567890abcdef
// Puede hacer cargos a tu cuenta de Stripe
```

### 6. 🔴 En Mensajes de Error

**Vulnerable**:

```typescript
router.get("/api-call", async (ctx) => {
  try {
    const result = await fetch("https://api.stripe.com/v1/charges", {
      headers: { Authorization: `Bearer ${STRIPE_API_KEY}` },
    });
  } catch (error: any) {
    // 🔴 VULNERABILITY: Secret en mensaje de error
    ctx.status = 500;
    ctx.body = {
      error: error.message,
      details: `API call failed with key: ${STRIPE_API_KEY}`, // 🔴 EXPUESTO
      stack: error.stack, // 🔴 Puede contener secretos
    };
  }
});
```

---

## 🛡️ Cómo Proteger los Secretos

### 1. ✅ Usar Variables de Entorno

**`.env` file (NEVER COMMIT)**:

```bash
# .env (add to .gitignore)
DATABASE_URL=postgresql://admin:SuperSecret123!@db.internal.com:5432/prod
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_API_KEY=sk_live_1234567890abcdef
JWT_SECRET=my-super-secret-jwt-key-with-256-bits
```

**`.env.example` file (COMMIT THIS)**:

```bash
# .env.example (template for developers)
DATABASE_URL=postgresql://user:password@host:port/database
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
STRIPE_API_KEY=sk_live_your_stripe_key
JWT_SECRET=generate_a_strong_secret_here
```

**`.gitignore`**:

```gitignore
# Never commit secrets
.env
.env.local
.env.production
.env.development

# Private keys
*.pem
*.key
*.p12
*.pfx

# Secrets directory
secrets/
credentials/
```

**Load secrets in code**:

```typescript
// backend/config/index.ts
import dotenv from "dotenv";
dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  stripe: {
    apiKey: process.env.STRIPE_API_KEY!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
  },
};

// Validate that secrets are loaded
if (!config.database.url || !config.jwt.secret) {
  throw new Error("Missing required environment variables");
}
```

### 2. ✅ Usar AWS Secrets Manager / HashiCorp Vault

```typescript
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

const secretsManager = new SecretsManager({ region: "us-east-1" });

async function getSecret(secretName: string) {
  const response = await secretsManager.getSecretValue({
    SecretId: secretName,
  });
  return JSON.parse(response.SecretString!);
}

// Usage
const dbCredentials = await getSecret("prod/database/credentials");
const apiKeys = await getSecret("prod/api-keys");
```

### 3. ✅ Nunca Loggear Secretos

```typescript
// ❌ NUNCA HACER ESTO
console.log(`Password: ${password}`);
console.log(`Token: ${jwtToken}`);
console.log(`API Key: ${apiKey}`);

// ✅ CORRECTO
console.log(`Login attempt for user: ${username}`);
// Password NUNCA se loggea

// ✅ USAR LOGGER CON REDACCIÓN AUTOMÁTICA
import winston from "winston";
import redact from "winston-redact";

const logger = winston.createLogger({
  format: winston.format.combine(
    redact({
      paths: ["password", "apiKey", "token", "secret"],
      censor: "***REDACTED***",
    }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Esto loggea de forma segura
logger.info("Login attempt", { username, password });
// Output: { username: "alice", password: "***REDACTED***" }
```

### 4. ✅ Nunca Exponer Secretos en HTTP

```typescript
// ❌ VULNERABLE
router.get("/config", async (ctx) => {
  ctx.body = {
    database: { password: DB_PASSWORD }, // ❌ NUNCA
    apiKeys: { stripe: STRIPE_API_KEY }, // ❌ NUNCA
  };
});

// ✅ SEGURO
router.get("/config", async (ctx) => {
  ctx.body = {
    database: {
      host: config.database.host, // ✅ OK (público)
      port: config.database.port, // ✅ OK (público)
      // password: NUNCA exponer
    },
    apiEndpoint: "https://api.example.com", // ✅ OK (público)
    // apiKeys: NUNCA exponer
  };
});
```

### 5. ✅ Mensajes de Error Genéricos

```typescript
// ❌ VULNERABLE
try {
  await stripe.charges.create({ ... }, { apiKey: STRIPE_API_KEY });
} catch (error: any) {
  ctx.body = {
    error: error.message,  // Puede contener API key
    stack: error.stack  // Puede contener secretos
  };
}

// ✅ SEGURO
try {
  await stripe.charges.create({ ... }, { apiKey: STRIPE_API_KEY });
} catch (error: any) {
  // Log completo solo en servidor
  logger.error("Stripe API error", { error: error.message });

  // Mensaje genérico al cliente
  ctx.status = 500;
  ctx.body = {
    error: "Payment processing failed. Please try again.",
    errorId: Date.now()  // Para correlacionar con logs
  };
}
```

### 6. ✅ Separar Public Keys de Secret Keys

```typescript
// ✅ CORRECTO: Enviar PUBLIC keys al frontend
router.get("/client-config", async (ctx) => {
  ctx.body = {
    stripe: {
      publicKey: "pk_live_...", // ✅ SAFE (public key)
      // secretKey: NEVER send to client
    },
    mapbox: {
      publicToken: "pk.ey...", // ✅ SAFE (public token)
    },
    // All secret keys stay on backend
  };
});
```

---

## 🧪 Probando Secrets Exposure en la Demo

### Paso 1: Navegar a Secrets Exposure

Abre: `http://localhost:3100/vulnerabilities/secrets-exposure`

### Paso 2: Modo Vulnerable

1. Selecciona **"Vulnerable"**
2. Haz clic en **"🔧 Ver configuración del servidor"**:
   - ⚠️ Verás `password: "SuperSecret123!"`
   - ⚠️ Verás `apiKey: "sk_live_1234567890abcdef"`
   - ⚠️ Verás `jwtSecret: "my-super-secret-key"`
3. Haz clic en **"🔑 Ver secretos en git"**:
   - ⚠️ Muestra ejemplo de `.env` commitido a git
4. Haz clic en **"📱 Ver config del cliente"**:
   - ⚠️ Secretos enviados al frontend (visibles en DevTools)
5. Haz clic en **"❌ Ver error con secretos"**:
   - ⚠️ API key expuesta en mensaje de error

### Paso 3: Modo Seguro

1. Selecciona **"Seguro"**
2. Haz clic en los mismos payloads:
   - ✅ Solo configuración pública (host, port, endpoints)
   - ✅ Sin passwords, API keys, o secretos
   - ✅ Mensajes de error genéricos

---

## 🚨 Casos Reales de Secrets Exposure

### Uber (2016)

- **Exposición**: Credenciales de AWS en repositorio GitHub privado
- **Impacto**: 57 millones de usuarios afectados
- **Daño**: $148 millones en multas
- **Cómo**: Desarrollador commitió `.env` file con AWS keys

### Codecov (2021)

- **Exposición**: Docker image con secretos hardcodeados
- **Impacto**: 29,000 clientes afectados (incluyendo Google, Microsoft)
- **Daño**: Acceso a repositorios privados, CI/CD secrets
- **Cómo**: Atacantes comprometieron build script → robaron secrets

### Toyota (2022)

- **Exposición**: API key en código público de GitHub
- **Impacto**: 296,000 usuarios (datos de localización de vehículos)
- **Duración**: Expuesto por 5 años
- **Cómo**: Subcontratista commitió API key en repo público

### CircleCI (2023)

- **Exposición**: Intrusión permitió acceso a secrets de clientes
- **Impacto**: Secrets de miles de empresas expuestos
- **Daño**: Rotación masiva de secrets, incidentes downstream
- **Cómo**: Compromiso de infraestructura interna

---

## 🔍 Herramientas para Prevenir Exposición

### 1. **git-secrets** (Prevenir commits)

```bash
# Instalar
brew install git-secrets  # Mac
# apt-get install git-secrets  # Linux

# Configurar
git secrets --install
git secrets --register-aws  # AWS patterns

# Agregar patrones custom
git secrets --add 'password\s*=\s*.+'
git secrets --add 'api[_-]?key\s*=\s*.+'
git secrets --add --literal 'sk_live_'

# Escanear repositorio
git secrets --scan
```

### 2. **TruffleHog** (Escanear historial)

```bash
# Instalar
pip install trufflehog

# Escanear repo completo
trufflehog git https://github.com/user/repo --regex --entropy=True

# Escanear historial completo
trufflehog filesystem /path/to/repo --json
```

### 3. **GitHub Secret Scanning**

GitHub automáticamente escanea:

- AWS keys
- Azure keys
- Google Cloud keys
- Stripe keys
- Y 100+ providers más

Si detecta un secret → notifica al provider → key es revocada automáticamente

### 4. **Pre-commit Hooks**

```bash
# .git/hooks/pre-commit
#!/bin/sh

# Check for common secret patterns
if git diff --cached | grep -E 'password|api[_-]?key|secret|token' >/dev/null; then
  echo "⚠️  WARNING: Potential secret detected in commit"
  echo "Review your changes before committing"
  exit 1
fi

# Run git-secrets
git secrets --pre_commit_hook -- "$@"
```

---

## 💡 Mejores Prácticas

1. ✅ **NUNCA hardcodear secretos** en código fuente
2. ✅ **Usar `.env` files** + `.gitignore`
3. ✅ **Proveer `.env.example`** como template
4. ✅ **Rotar secretos regularmente** (cada 90 días mínimo)
5. ✅ **Principio de menor privilegio**: Solo acceso necesario
6. ✅ **Usar servicios de gestión de secretos**: AWS Secrets Manager, Vault
7. ✅ **Monitorear exposiciones**: GitHub secret scanning, TruffleHog
8. ✅ **Nunca loggear secretos**: Redact passwords/tokens en logs
9. ✅ **Separar ambientes**: Secrets diferentes para dev/staging/prod
10. ✅ **Auditar acceso**: Log quién accede a qué secretos

---

✅ **Secrets Exposure configurado y listo para demostrar**. Navega a `http://localhost:3100/vulnerabilities/secrets-exposure` para probarlo.
