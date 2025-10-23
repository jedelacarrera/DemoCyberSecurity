# 🛡️ Referencia Rápida: Missing Rate Limiting

## 📋 ¿Qué es Rate Limiting?

**Rate Limiting** es una técnica de seguridad que limita la cantidad de peticiones que un usuario (o IP) puede hacer a un servidor en un período de tiempo específico. Sin rate limiting, un atacante puede abusar de tus endpoints para:

- **🔐 Brute Force**: Probar millones de passwords/credenciales
- **🕷️ Web Scraping**: Extraer toda tu base de datos
- **💥 DoS (Denial of Service)**: Saturar tu servidor con peticiones
- **📧 Email Bombing**: Enviar miles de emails/SMS
- **💸 API Abuse**: Consumir recursos costosos (AWS, Stripe, OpenAI)

---

## 🎯 Cómo Funciona el Ataque

### Escenario 1: Brute Force Attack

**Vulnerable**:

```typescript
router.post("/login", async (ctx) => {
  const { username, password } = ctx.request.body;

  // VULNERABILITY: Intentos ilimitados
  const user = await User.findOne({ where: { username } });

  if (user && (await user.validatePassword(password))) {
    ctx.body = { success: true, token: generateJWT(user) };
  } else {
    ctx.status = 401;
    ctx.body = { error: "Invalid credentials" };
  }
});
```

**Ataque**:

```javascript
// Lista de passwords comunes
const passwords = [
  "123456",
  "password",
  "12345678",
  "qwerty",
  "123456789",
  "12345",
  "1234",
  "111111",
  "1234567",
  "dragon",
  // ... millones más
];

// Intentar todos los passwords
for (const password of passwords) {
  const response = await fetch("/api/vulnerable/rate-limiting/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password }),
    headers: { "Content-Type": "application/json" },
  });

  if (response.ok) {
    console.log(`✅ Password found: ${password}`);
    break;
  }
}

// Sin rate limiting:
// - Puede probar 1000 passwords/segundo
// - 1 millón de passwords en ~16 minutos
// - Eventualmente encuentra la contraseña
```

### Escenario 2: Denial of Service (DoS)

**Vulnerable**:

```typescript
router.post("/heavy-computation", async (ctx) => {
  const { iterations } = ctx.request.body;

  // VULNERABILITY: Acepta cualquier valor
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i);
  }

  ctx.body = { success: true, result };
});
```

**Ataque**:

```javascript
// Enviar muchas peticiones costosas
for (let i = 0; i < 100; i++) {
  fetch("/api/vulnerable/rate-limiting/heavy-computation", {
    method: "POST",
    body: JSON.stringify({ iterations: 999999999 }),
    headers: { "Content-Type": "application/json" },
  });
}

// Sin rate limiting:
// - CPU del servidor al 100%
// - Servidor deja de responder
// - Usuarios legítimos no pueden acceder
```

### Escenario 3: Web Scraping / Data Extraction

**Vulnerable**:

```typescript
router.get("/data", async (ctx) => {
  const { page } = ctx.query;

  // VULNERABILITY: Sin límite de peticiones
  const users = await User.findAll({
    limit: 100,
    offset: page * 100,
  });

  ctx.body = { success: true, data: users };
});
```

**Ataque**:

```javascript
// Descargar toda la base de datos
const allData = [];

for (let page = 0; page < 10000; page++) {
  const response = await fetch(
    `/api/vulnerable/rate-limiting/data?page=${page}`
  );
  const data = await response.json();
  allData.push(...data.data);
}

console.log(`Descargados ${allData.length} registros`);

// Sin rate limiting:
// - Puede hacer 1000+ peticiones/segundo
// - Descarga millones de registros en minutos
// - Vende la base de datos en dark web
```

### Escenario 4: Email Bombing / SMS Spam

**Vulnerable**:

```typescript
router.post("/send-email", async (ctx) => {
  const { to, subject, body } = ctx.request.body;

  // VULNERABILITY: Sin límite de emails
  await sendEmail({ to, subject, body });

  ctx.body = { success: true, message: "Email sent" };
});
```

**Ataque**:

```javascript
// Enviar miles de emails
for (let i = 0; i < 10000; i++) {
  fetch("/api/vulnerable/rate-limiting/send-email", {
    method: "POST",
    body: JSON.stringify({
      to: "victim@example.com",
      subject: `Spam #${i}`,
      body: "Buy this product now!!!",
    }),
    headers: { "Content-Type": "application/json" },
  });
}

// Sin rate limiting:
// - Inunda la casilla del usuario
// - Tu servidor de email es blacklisteado
// - Facturas enormes de servicios SMTP (SendGrid, Mailgun)
```

---

## 🛡️ Cómo Implementar Rate Limiting

### 1. ✅ Rate Limiting con Redis (Koa)

```typescript
import rateLimit from "koa-ratelimit";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: 6379,
});

// Rate Limiter General (100 peticiones/minuto)
const generalRateLimiter = rateLimit({
  driver: "redis",
  db: redis,
  duration: 60 * 1000, // 1 minuto
  max: 100, // Máximo 100 peticiones
  errorMessage: "Too many requests. Please try again later.",
  id: (ctx) => ctx.ip, // Por IP
  headers: {
    remaining: "Rate-Limit-Remaining",
    reset: "Rate-Limit-Reset",
    total: "Rate-Limit-Total",
  },
});

// Rate Limiter Estricto (10 peticiones/minuto)
const strictRateLimiter = rateLimit({
  driver: "redis",
  db: redis,
  duration: 60 * 1000,
  max: 10,
  errorMessage: "Rate limit exceeded. Please slow down.",
});

// Rate Limiter para Login (5 intentos / 5 minutos)
const loginRateLimiter = rateLimit({
  driver: "redis",
  db: redis,
  duration: 5 * 60 * 1000, // 5 minutos
  max: 5, // Máximo 5 intentos
  errorMessage: "Too many login attempts. Try again in 5 minutes.",
  id: (ctx) => {
    // Combinar IP + username para mayor seguridad
    const username = ctx.request.body?.username || "unknown";
    return `${ctx.ip}:${username}`;
  },
});

// Aplicar a rutas
router.get("/data", generalRateLimiter, async (ctx) => {
  // Tu lógica
});

router.post("/login", loginRateLimiter, async (ctx) => {
  // Tu lógica de login
});

router.post("/heavy-computation", strictRateLimiter, async (ctx) => {
  // Operación costosa
});
```

### 2. ✅ Rate Limiting con Express

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redis = new Redis();

// Rate Limiter General
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: "rl:general:",
  }),
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: "Too many requests, please try again later.",
});

// Rate Limiter para Login
const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: "rl:login:",
  }),
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5,
  skipSuccessfulRequests: true, // No contar logins exitosos
  message: "Too many login attempts. Try again in 5 minutes.",
});

// Aplicar a rutas
app.get("/api/data", generalLimiter, (req, res) => {
  // Tu lógica
});

app.post("/api/login", loginLimiter, (req, res) => {
  // Tu lógica de login
});
```

### 3. ✅ Rate Limiting con Nginx (Reverse Proxy)

```nginx
# nginx.conf

# Definir zona de rate limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/5m;
limit_req_zone $binary_remote_addr zone=api:10m rate=1000r/h;

server {
  listen 80;
  server_name example.com;

  # Rate limiting general
  location /api/ {
    limit_req zone=general burst=20 nodelay;
    limit_req_status 429;
    proxy_pass http://backend:3000;
  }

  # Rate limiting estricto para login
  location /api/login {
    limit_req zone=login burst=2 nodelay;
    limit_req_status 429;
    proxy_pass http://backend:3000;
  }

  # Rate limiting para APIs públicas
  location /api/public/ {
    limit_req zone=api burst=50;
    limit_req_status 429;
    proxy_pass http://backend:3000;
  }
}
```

### 4. ✅ Rate Limiting por Usuario (además de IP)

```typescript
const userBasedLimiter = rateLimit({
  driver: "redis",
  db: redis,
  duration: 60 * 1000,
  max: 50,
  id: (ctx) => {
    // Si está autenticado, usar user ID
    if (ctx.state.user) {
      return `user:${ctx.state.user.id}`;
    }
    // Si no, usar IP
    return `ip:${ctx.ip}`;
  },
});
```

### 5. ✅ Whitelist para IPs Confiables

```typescript
const rateLimiterWithWhitelist = rateLimit({
  driver: "redis",
  db: redis,
  duration: 60 * 1000,
  max: 100,
  whitelist: (ctx) => {
    // IPs de tu red interna, CI/CD, etc.
    const trustedIPs = ["192.168.1.0/24", "10.0.0.0/8", "your-office-ip"];

    return trustedIPs.some((ip) => ctx.ip.startsWith(ip.split("/")[0]));
  },
});
```

---

## 🧪 Probando Rate Limiting en la Demo

### Paso 1: Navegar a Rate Limiting

Abre: `http://localhost:3100/vulnerabilities/rate-limiting`

### Paso 2: Modo Vulnerable

1. Selecciona **"Vulnerable"**
2. Haz clic en **"🔐 Login intento #1"** → Funciona
3. Haz clic en **"🔐 Login intento #2"** → Funciona
4. Haz clic en **"🔐 Login intento #3"** → Funciona
5. **Sigue haciendo clic rápidamente** → Todas siguen funcionando (sin límite)

### Paso 3: Modo Seguro

1. Selecciona **"Seguro"**
2. Haz clic en **"🔐 Login intento #1"** → Funciona
3. Haz clic en **"🔐 Login intento #2"** → Funciona
4. Haz clic en **"🔐 Login intento #3"** → Funciona
5. Haz clic en **"🔐 Login intento #4"** → Funciona
6. Haz clic en **"🔐 Login intento #5"** → Funciona
7. Haz clic en **"🔴 Intento #6+"** → ❌ **"Too many login attempts. Try again in 5 minutes"**

---

## 📊 Configuraciones Recomendadas

| Endpoint                 | Límite Recomendado | Razón                                |
| ------------------------ | ------------------ | ------------------------------------ |
| **Login**                | 5-10 / 5 minutos   | Prevenir brute force                 |
| **Password Reset**       | 3 / 15 minutos     | Prevenir enumeración de emails       |
| **API Pública**          | 1000-10000 / hora  | Prevenir scraping y DoS              |
| **API Autenticada**      | 100-1000 / minuto  | Límite más alto para usuarios reales |
| **Email/SMS**            | 5-10 / hora        | Prevenir spam y facturas altas       |
| **Operaciones Costosas** | 10-50 / minuto     | Prevenir DoS por consumo CPU/memoria |
| **File Upload**          | 5-10 / hora        | Prevenir abuso de storage            |
| **Búsquedas**            | 100 / minuto       | Prevenir scraping de resultados      |

---

## 🚨 Casos Reales sin Rate Limiting

### GitHub (2013)

- **Ataque**: Brute force de passwords sin rate limiting
- **Impacto**: Cuentas comprometidas
- **Fix**: Implementaron rate limiting estricto + 2FA

### Snapchat (2014)

- **Ataque**: API sin rate limiting permitió scraping
- **Impacto**: 4.6 millones de números de teléfono filtrados
- **Fix**: Rate limiting + CAPTCHA en endpoints sensibles

### Instagram (2016)

- **Ataque**: Endpoint sin rate limiting permitió brute force
- **Impacto**: Cuentas de celebridades comprometidas
- **Fix**: Rate limiting + detección de patrones anómalos

---

## 💡 Mejores Prácticas

1. **Rate Limiting por IP + Usuario**: Más difícil de bypassear
2. **Diferentes límites según tipo de usuario**: Free vs Premium
3. **Límites más estrictos para operaciones sensibles**: Login, password reset
4. **Headers informativos**: Indicar límites restantes en respuesta
5. **Logging**: Registrar intentos que exceden límites (detección de ataques)
6. **Gradual backoff**: Aumentar tiempo de espera con cada intento fallido
7. **CAPTCHA después de límite**: Para usuarios legítimos que excedan límite
8. **Monitoreo**: Alertas cuando IPs exceden límites frecuentemente

---

✅ **Rate Limiting configurado y listo para demostrar**. Navega a `http://localhost:3100/vulnerabilities/rate-limiting` para probarlo.
