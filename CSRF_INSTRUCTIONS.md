# 🎣 Instrucciones para Demo de CSRF

## 📋 Pasos para usar la Demo de CSRF

### 🔐 Paso 1: Autenticarse (OBLIGATORIO)

CSRF requiere que estés autenticado. Los endpoints verifican el JWT token.

1. Ve a **Authentication Failures** en el menú

   ```
   http://localhost:3100/vulnerabilities/authentication-failures
   ```

2. Selecciona modo **"Vulnerable"**

3. Haz clic en cualquier payload de login:

   - `admin:admin123` (recomendado)
   - `user:user123`
   - `alice:alice123`
   - `bob:bob123`

4. Haz clic en **"Ejecutar prueba"**

5. **Verás un alert:** "✅ Token JWT guardado automáticamente"

6. **Verifica en la consola del navegador:**
   ```javascript
   localStorage.getItem("token");
   // Debería mostrar: "eyJhbGciOiJub25lIi..."
   ```

---

### 🎯 Paso 2: Probar CSRF en el Frontend

1. Ve a **Cross-Site Request Forgery (CSRF)**

   ```
   http://localhost:3100/vulnerabilities/csrf
   ```

2. **Deberías ver:** "✅ Token JWT Detectado" (verde)

   - Si ves "⚠️ CSRF Requiere Autenticación" (naranja) → Vuelve al Paso 1

3. Selecciona modo **"Vulnerable"**

4. Prueba los payloads:

   - `alice:100` → Transferir $100 a alice
   - `attacker:1000` → Transferir $1000 al atacante

5. Haz clic en **"Ejecutar prueba (POST)"**

6. **Resultado esperado (Vulnerable):**

   ```json
   {
     "success": true,
     "message": "Transferred $100 from admin to alice",
     "warning": "This endpoint has no CSRF protection!"
   }
   ```

7. **Cambia a modo "Seguro"** y prueba de nuevo:
   ```json
   {
     "success": false,
     "error": "Invalid CSRF token"
   }
   ```

---

### 🔴 Paso 3: Ver el Ataque Visual (Sitio Malicioso)

1. Abre el servidor atacante:

   ```
   http://localhost:3002
   ```

2. Haz clic en **"CSRF Demo"**

   ```
   http://localhost:3002/csrf-demo.html
   ```

3. Verás un sitio falso con "¡Gana $1000 Gratis!"

4. **IMPORTANTE:** Asegúrate de estar autenticado (Paso 1)

5. Haz clic en el botón **"¡RECLAMAR MI PREMIO!"** 🎉

6. **Observa el log en tiempo real:**

   ```
   🎯 Usuario hizo clic en el botón...
   📤 Enviando formulario oculto CSRF...
   🔑 Token JWT encontrado (solo funciona en localhost)
   🔓 Navegador enviando cookies automáticamente...
   ✅ ¡Ataque CSRF exitoso!
   💸 Transferred $1000 from admin to attacker
   ```

7. Verás un alert: "¡Felicidades! Tu 'premio' ha sido procesado... 😈"

---

## 🔍 ¿Qué Está Pasando?

### En el Sitio Malicioso (csrf-demo.html):

```html
<!-- Formulario CSRF oculto -->
<form
  id="csrfForm"
  action="http://localhost:3101/api/vulnerable/csrf/transfer-money"
  method="POST"
>
  <input name="toUser" value="attacker" />
  <input name="amount" value="1000" />
</form>

<script>
  // Usuario hace clic en botón "inocente"
  document.getElementById("csrfForm").submit();
</script>
```

### Lo que sucede:

1. ✅ Usuario está autenticado (tiene JWT token)
2. ⚠️ Usuario visita sitio malicioso
3. 🎭 Sitio malicioso presenta oferta falsa
4. 👆 Usuario hace clic en botón
5. 📤 JavaScript envía formulario oculto
6. 🔑 Navegador incluye el JWT token automáticamente (localStorage)
7. 🏦 Servidor ve petición autenticada
8. ✅ Servidor ejecuta transferencia (sin validar CSRF)
9. 💸 ¡$1000 transferidos sin conocimiento del usuario!

---

## 🛡️ ¿Por Qué el Modo Seguro lo Previene?

### Vulnerable:

```javascript
// Solo verifica autenticación
router.post("/transfer-money", authMiddleware, async (ctx) => {
  // ✅ Tiene JWT válido
  // ❌ No verifica origen de la petición
  // ❌ No requiere token CSRF
  transferMoney(); // ¡Ejecuta!
});
```

### Seguro:

```javascript
// Requiere token CSRF además de autenticación
router.post(
  "/transfer-money",
  authMiddleware, // ✅ Verifica JWT
  csrfProtection, // ✅ Verifica token CSRF
  async (ctx) => {
    // Cliente debe enviar:
    // - Authorization: Bearer JWT_TOKEN
    // - X-CSRF-Token: CSRF_TOKEN

    // Sitio malicioso NO puede obtener CSRF token
    // porque está en localStorage/sessionStorage
    // y Same-Origin Policy lo bloquea
    transferMoney();
  }
);
```

---

## 🧹 Limpiar Todo

Si quieres empezar de nuevo:

1. **Eliminar token en el Frontend:**

   - Ve a CSRF demo
   - Haz clic en botón "🗑️ Eliminar Token"
   - O en consola: `localStorage.removeItem('token')`

2. **Verificar:**

   ```javascript
   localStorage.getItem("token");
   // Debería ser: null
   ```

3. **Recarga la página** y verás el mensaje naranja pidiendo autenticación

---

## 🎓 Conceptos Clave

| Concepto               | Explicación                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| **CSRF Token**         | Token único generado por servidor, guardado en cliente (NO en cookie) |
| **JWT Token**          | Autenticación del usuario, se envía en cada petición                  |
| **Same-Origin Policy** | Sitios maliciosos NO pueden leer localStorage de otros sitios         |
| **Credentials**        | Cookies/tokens que navegador envía automáticamente                    |
| **CSRF Protection**    | Middleware que valida token CSRF en cada petición crítica             |

---

## 🚨 Errores Comunes

### Error: "No token provided"

**Solución:** Haz login primero en Authentication Failures

### Error: "Invalid CSRF token"

**Solución:** Esto es CORRECTO en modo Seguro (bloquea el ataque)

### Error: Sitio malicioso no puede leer token

**Solución:** En localhost comparten origen. En producción, dominios diferentes NO pueden leer localStorage del otro.

---

## 📊 Flujo Completo

```
┌─────────────────────────────────────────────────┐
│ 1. Login en Authentication Failures             │
│    → Token guardado en localStorage             │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 2. Ir a CSRF Demo                               │
│    → Ver mensaje verde "Token JWT Detectado"    │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 3. Modo Vulnerable                              │
│    → Transferencia exitosa SIN CSRF validation  │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 4. Modo Seguro                                  │
│    → Error: "Invalid CSRF token"                │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 5. Sitio Malicioso (localhost:3002/csrf-demo)   │
│    → Ataque exitoso en vulnerable               │
│    → Bloqueado en seguro                        │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Checklist

- [ ] Servidor backend corriendo en puerto 3101
- [ ] Frontend corriendo en puerto 3100
- [ ] Servidor atacante corriendo en puerto 3002
- [ ] Login realizado en Authentication Failures
- [ ] Token guardado en localStorage (verificar en consola)
- [ ] Mensaje verde en CSRF demo
- [ ] Probado modo Vulnerable (exitoso)
- [ ] Probado modo Seguro (bloqueado)
- [ ] Probado sitio malicioso (csrf-demo.html)

---

¡Listo! Ahora puedes demostrar CSRF de forma completa e interactiva. 🎓🔒
