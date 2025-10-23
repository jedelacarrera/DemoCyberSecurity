# 🌐 Referencia Rápida: Server-Side Request Forgery (SSRF)

## 📋 ¿Qué es SSRF?

**SSRF (Server-Side Request Forgery)** es una vulnerabilidad que permite a un atacante hacer que el servidor realice peticiones HTTP a URLs arbitrarias. Esto puede exponer:

- 🔓 **Servicios internos**: `localhost`, `127.0.0.1`, redes privadas (`192.168.x.x`, `10.x.x.x`)
- ☁️ **Metadata de Cloud**: Credenciales IAM en AWS EC2, GCP, Azure (`169.254.169.254`)
- 🔍 **Escaneo de puertos**: Detectar servicios internos (MySQL, Redis, SSH, etc.)
- 📡 **Bypass de firewalls**: Acceder a recursos que normalmente están protegidos

---

## 🎯 Cómo Funciona el Ataque

### Escenario Vulnerable

Una aplicación web permite a los usuarios ingresar una URL para "obtener una imagen":

```typescript
// VULNERABLE
router.post("/fetch-image", async (ctx) => {
  const { url } = ctx.request.body;
  const response = await fetch(url); // ⚠️ Sin validación
  ctx.body = { success: true, data: response };
});
```

### Ataques Posibles

1. **Acceso a Servicios Internos**:

   ```
   http://127.0.0.1:3101/api/admin/secrets
   http://localhost:6379/  (Redis)
   http://192.168.1.50:22  (SSH - escaneo de puertos)
   ```

2. **Robo de Credenciales de Cloud** (AWS EC2):

   ```
   http://169.254.169.254/latest/meta-data/iam/security-credentials/role-name
   ```

   Esto devuelve:

   ```json
   {
     "AccessKeyId": "ASIA...",
     "SecretAccessKey": "wJalr...",
     "Token": "IQoJb3..."
   }
   ```

3. **Lectura de Archivos Locales** (si `file://` no está bloqueado):

   ```
   file:///etc/passwd
   file:///var/www/html/config.php
   ```

4. **Bypass con Redirects**:
   ```
   https://attacker.com/redirect.php → http://127.0.0.1/admin
   ```

---

## 🛡️ Cómo Protegerse contra SSRF

### 1. **Whitelist de Dominios**

```typescript
const ALLOWED_DOMAINS = [
  "example.com",
  "api.example.com",
  "images.example.com",
];

const parsedUrl = new URL(url);
const isAllowed = ALLOWED_DOMAINS.some(
  (domain) =>
    parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
);

if (!isAllowed) {
  throw new Error("Domain not in whitelist");
}
```

### 2. **Bloquear IPs Privadas**

```typescript
const isPrivateIP = (hostname: string): boolean => {
  const privateRanges = [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^127\./, // 127.0.0.0/8 (localhost)
    /^169\.254\./, // 169.254.0.0/16 (cloud metadata)
    /^::1$/, // IPv6 localhost
    /^fc00:/, // IPv6 private
    /^fe80:/, // IPv6 link-local
    /localhost/i,
  ];
  return privateRanges.some((range) => range.test(hostname));
};

if (isPrivateIP(parsedUrl.hostname)) {
  throw new Error("Private IPs are forbidden");
}
```

### 3. **Validar Protocolos**

```typescript
if (!["http:", "https:"].includes(parsedUrl.protocol)) {
  throw new Error("Only HTTP/HTTPS allowed");
}
```

### 4. **No Seguir Redirects**

```typescript
const response = await fetch(url, {
  redirect: "manual", // Previene bypass con redirects
  timeout: 5000,
});
```

### 5. **Resolución DNS Separada** (Avanzado)

Antes de hacer el fetch, resuelve el DNS y verifica que no sea una IP privada:

```typescript
import dns from "dns/promises";

const addresses = await dns.resolve4(parsedUrl.hostname);
for (const ip of addresses) {
  if (isPrivateIP(ip)) {
    throw new Error("DNS resolves to private IP");
  }
}
```

---

## 🧪 Probando SSRF en la Demo

### Paso 1: Navegar a SSRF

Abre: `http://localhost:3100/vulnerabilities/ssrf`

### Paso 2: Modo Vulnerable

1. Selecciona **"Vulnerable"**
2. Prueba estos payloads:

   - **🌐 URL externa válida**: `https://httpbin.org/json`

     - ✅ Debería funcionar

   - **🔴 Localhost**: `http://127.0.0.1:3101/api/admin`

     - ⚠️ Accede a recursos internos

   - **☁️ AWS Metadata**: `http://169.254.169.254/latest/meta-data/`

     - ⚠️ En AWS EC2, esto expondría credenciales IAM

   - **🔴 File protocol**: `file:///etc/passwd`
     - ⚠️ Puede leer archivos del sistema (si no está bloqueado por `node-fetch`)

### Paso 3: Modo Seguro

1. Selecciona **"Seguro"**
2. Prueba los mismos payloads:
   - Solo las URLs en el **whitelist** (`example.com`, etc.) funcionarán
   - Todas las IPs privadas serán bloqueadas
   - Protocolos como `file://` serán rechazados

---

## 📊 Comparación: Vulnerable vs. Seguro

| Aspecto               | Vulnerable ❌               | Seguro ✅                           |
| --------------------- | --------------------------- | ----------------------------------- |
| **Validación de URL** | Ninguna                     | Parse con `new URL()`               |
| **Whitelist**         | No                          | Sí, solo dominios permitidos        |
| **IPs Privadas**      | Permitidas                  | Bloqueadas (10.x, 192.168.x, 127.x) |
| **Cloud Metadata**    | Accesible (169.254.169.254) | Bloqueado                           |
| **Protocolos**        | Todos (`file://`, etc.)     | Solo `http://` y `https://`         |
| **Redirects**         | Sigue automáticamente       | `redirect: "manual"` (no sigue)     |
| **Timeout**           | Sin límite                  | 5000ms                              |

---

## 🚨 Casos Reales de SSRF

### Capital One (2019)

- Atacante usó SSRF en una aplicación web de AWS EC2
- Accedió a metadata: `http://169.254.169.254/latest/meta-data/iam/security-credentials/`
- Obtuvo credenciales IAM con acceso a S3
- **Impacto**: 100 millones de registros de clientes robados

### GitLab (2021)

- SSRF en la función "Import Projects from URL"
- Permitía acceso a servicios internos de Redis y PostgreSQL
- **CVE-2021-22205**: Crítico (RCE vía SSRF)

### Shopify (2016)

- SSRF en generador de PDF (conversión de HTML a PDF)
- Permitía leer archivos internos y acceder a servicios internos
- **Recompensa de Bug Bounty**: $25,000 USD

---

## 🔗 Recursos Adicionales

- [OWASP SSRF Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [PortSwigger: SSRF Attacks](https://portswigger.net/web-security/ssrf)
- [HackerOne SSRF Reports](https://hackerone.com/reports?text=ssrf)
- [AWS SSRF Protection](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html)

---

## 💡 Puntos Clave para Recordar

1. **Nunca confíes en URLs proporcionadas por usuarios** sin validación exhaustiva.
2. **Usa whitelists**, no blacklists (es imposible listar todas las IPs privadas y trucos de bypass).
3. **Bloquea acceso a metadata de cloud** (`169.254.169.254` en AWS/GCP/Azure).
4. **No sigas redirects automáticamente** (pueden llevar a IPs privadas).
5. **Implementa timeouts** para prevenir ataques de denegación de servicio.
6. **Considera usar un servicio proxy** que maneje todas las validaciones SSRF de forma centralizada.

---

## 🛠️ Comandos Útiles para la Demo

### Reiniciar el Frontend (si hay errores)

```bash
cd frontend
rm -rf .next
npm run dev
```

### Ver Logs del Backend (para debugging SSRF)

```bash
cd backend
npm run dev
# Verás las peticiones fetch en consola
```

### Simular AWS Metadata Localmente (para testing)

```bash
# En un terminal separado
npm install -g http-server
mkdir -p mock-metadata/latest/meta-data/iam/security-credentials
echo '{"AccessKeyId":"ASIA...","SecretAccessKey":"wJalr..."}' > mock-metadata/latest/meta-data/iam/security-credentials/role-name
cd mock-metadata
http-server -p 8169
```

Luego prueba: `http://localhost:8169/latest/meta-data/iam/security-credentials/role-name`

---

✅ **SSRF configurado y listo para demostrar**. Puedes navegar a `http://localhost:3100/vulnerabilities/ssrf` para probarlo.
