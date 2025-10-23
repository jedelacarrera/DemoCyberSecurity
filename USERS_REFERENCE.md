# 👥 Usuarios de Demo - Referencia Rápida

Este archivo contiene las credenciales de los usuarios creados en la base de datos para testing.

## 📋 Usuarios Disponibles

### 👑 Admin

```
Username: admin
Password: admin123
Role: admin
Email: admin@example.com
```

### 👤 Usuario Normal

```
Username: user
Password: user123
Role: user
Email: user@example.com
```

### 👤 Alice

```
Username: alice
Password: alice123
Role: user
Email: alice@example.com
```

### 👤 Bob

```
Username: bob
Password: bob123
Role: user
Email: bob@example.com
```

---

## 🎯 Uso en las Demos

### SQL Injection (Login Bypass)

```
Endpoint: POST /api/vulnerable/sql-injection/login

Normal: username=admin&password=admin123
Bypass: username=admin' --&password=cualquiercosa
```

### Authentication Failures (JWT "none")

```
Endpoint: POST /api/vulnerable/auth/login-none-alg

Formato: username:password
Ejemplos:
- admin:admin123
- alice:alice123
- user:user123
```

### Broken Access Control (IDOR)

```
Endpoint: GET /api/vulnerable/access-control/users/:id

Prueba acceder a IDs: 1, 2, 3, 4
(todos los usuarios sin autenticación)
```

---

## 🔒 Ubicación del Seeder

```
backend/src/seeders/20240101000001-demo-users.js
```

---

## ⚙️ Ejecutar Seeders

Si necesitas recrear los usuarios:

```bash
cd backend
npx sequelize-cli db:seed:all
```

O para hacer reset completo:

```bash
npx sequelize-cli db:seed:undo:all
npx sequelize-cli db:seed:all
```
