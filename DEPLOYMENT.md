# Guía de Despliegue en Google Cloud

Esta guía te ayudará a desplegar el demo de vulnerabilidades OWASP en Google Cloud Platform usando Cloud Build y Cloud Run.

## 📋 Requisitos Previos

1. **Cuenta de GCP** con facturación habilitada
2. **Proyecto de GCP** creado
3. **gcloud CLI** instalado y configurado
   - [Guía de instalación](https://cloud.google.com/sdk/docs/install)
4. **Git** instalado

## 🚀 Opción 1: Despliegue Automático (Recomendado)

Esta es la forma más rápida de desplegar todo el sistema.

### Paso 1: Configurar GCP

Ejecuta el script de configuración que creará toda la infraestructura necesaria:

```bash
# Hacer el script ejecutable
chmod +x scripts/setup-gcp.sh

# Ejecutar configuración
./scripts/setup-gcp.sh
```

Este script:

- ✅ Habilita las APIs necesarias (Cloud Run, Artifact Registry, etc.)
- ✅ Crea un repositorio en Artifact Registry
- ✅ Genera y almacena secretos de forma segura (JWT secrets, Session secrets)
- ✅ Configura permisos para Cloud Build
- ✅ Guarda la configuración en `gcp-config.env`

**⚠️ Importante:** El script generará secrets. Guarda el archivo `gcp-config.env` en un lugar seguro.

**Nota:** Esta aplicación usa SQLite en memoria, por lo que no requiere Cloud SQL. Los datos se resetean en cada reinicio, perfecto para demos.

### Paso 2: Desplegar la Aplicación

Una vez completada la configuración, despliega la aplicación:

```bash
# Hacer el script ejecutable
chmod +x scripts/deploy.sh

# Desplegar
./scripts/deploy.sh
```

Este script:

- 🔨 Construye las imágenes Docker (backend, frontend, attacker)
- 📦 Las sube a Artifact Registry
- 🚀 Despliega los servicios en Cloud Run
- 🔗 Te proporciona las URLs de acceso

**Nota:** No se requieren migraciones. La base de datos se inicializa automáticamente con datos de demo al iniciar cada instancia.

### Paso 3: Acceder a la Aplicación

Las URLs de tus servicios se mostrarán al final del despliegue:

```
Frontend:  https://owasp-demo-frontend-XXXX-uc.a.run.app
Backend:   https://owasp-demo-backend-XXXX-uc.a.run.app
Attacker:  https://owasp-demo-attacker-XXXX-uc.a.run.app
```

## 🔧 Opción 2: Despliegue Manual

Si prefieres más control sobre el proceso:

### 1. Configurar el Proyecto

```bash
# Configurar proyecto
gcloud config set project TU_PROJECT_ID

# Habilitar APIs
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com
```

### 2. Crear Artifact Registry

```bash
gcloud artifacts repositories create owasp-demo \
    --repository-format=docker \
    --location=us-central1 \
    --description="OWASP Demo Docker Repository"

# Configurar Docker
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 3. Crear Secretos

```bash
# Generar secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Crear en Secret Manager
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
echo -n "$SESSION_SECRET" | gcloud secrets create session-secret --data-file=-
```

**Nota:** No se requiere Cloud SQL. La aplicación usa SQLite en memoria.

### 5. Desplegar con Cloud Build

```bash
# Desplegar usando cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml
```

## 📝 Configuración de Variables

El archivo `cloudbuild.yaml` usa las siguientes variables que puedes personalizar:

```yaml
substitutions:
  _REGION: "us-central1" # Región de GCP
  _REPOSITORY: "owasp-demo" # Nombre del repositorio
  _DB_INSTANCE_NAME: "owasp-demo-db" # Nombre de la instancia de BD
  _DB_USER: "owasp_user" # Usuario de la BD
  _DB_NAME: "owasp_demo" # Nombre de la BD
  _ENABLE_VULNERABLE: "true" # Habilitar endpoints vulnerables
```

Para cambiarlas en el despliegue:

```bash
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_REGION=europe-west1,_ENABLE_VULNERABLE=false
```

## 🔄 Actualizaciones y Redespliegue

Para actualizar la aplicación después de hacer cambios:

```bash
# Simplemente vuelve a ejecutar el script de despliegue
./scripts/deploy.sh
```

O manualmente:

```bash
gcloud builds submit --config cloudbuild.yaml
```

## 📊 Monitoreo y Logs

### Ver logs de los servicios

```bash
# Logs del backend
gcloud run logs read owasp-demo-backend --limit=50

# Logs del frontend
gcloud run logs read owasp-demo-frontend --limit=50

# Logs en tiempo real
gcloud run logs tail owasp-demo-backend
```

### Ver estado de Cloud Build

```bash
# Ver builds recientes
gcloud builds list --limit=10

# Ver detalles de un build
gcloud builds describe BUILD_ID

# Ver logs de un build
gcloud builds log BUILD_ID
```

### Monitorear servicios

```bash
# Estado de los servicios
gcloud run services list

# Detalles de un servicio
gcloud run services describe owasp-demo-backend --region=us-central1

# Métricas en Cloud Console
# https://console.cloud.google.com/run
```

## 💰 Costos Estimados

Con uso mínimo (para demos/desarrollo):

- **Cloud Run** (3 servicios): ~$0-10/mes (pago por uso, escala a cero cuando no se usa)
- **Artifact Registry**: ~$0.10/GB de almacenamiento
- **Secret Manager**: ~$0.06 por secreto/mes (2 secretos = ~$0.12/mes)

**Total estimado**: $1-15/mes dependiendo del uso

**¡Ahorro significativo!** Al usar SQLite en memoria en lugar de Cloud SQL, se eliminan ~$10-15/mes de costos fijos.

### Optimización de Costos

1. **Los servicios de Cloud Run** están configurados con `--min-instances=0`, por lo que escalan a cero cuando no reciben tráfico. **No hay costos cuando no se usa.**

2. **Elimina imágenes antiguas** de Artifact Registry que no uses para reducir costos de almacenamiento

3. **Detén Cloud Build** automáticamente después de cada build (ya configurado)

## 🧹 Limpieza de Recursos

Para eliminar todos los recursos y evitar costos:

```bash
# Hacer el script ejecutable
chmod +x scripts/cleanup.sh

# Ejecutar limpieza
./scripts/cleanup.sh
```

⚠️ **ADVERTENCIA**: Esto eliminará permanentemente todos los recursos.

O manualmente:

```bash
# Eliminar servicios de Cloud Run
gcloud run services delete owasp-demo-backend --region=us-central1 --quiet
gcloud run services delete owasp-demo-frontend --region=us-central1 --quiet
gcloud run services delete owasp-demo-attacker --region=us-central1 --quiet

# Eliminar Artifact Registry
gcloud artifacts repositories delete owasp-demo --location=us-central1 --quiet

# Eliminar secretos
gcloud secrets delete jwt-secret --quiet
gcloud secrets delete session-secret --quiet
```

## 🔐 Consideraciones de Seguridad

### Para Ambiente de Demo (Configuración Actual)

✅ **Adecuado para:**

- Demostraciones educativas
- Entornos de desarrollo
- Talleres y capacitaciones

⚠️ **Configuraciones de demo:**

- Endpoints vulnerables habilitados (`ENABLE_VULNERABLE_ENDPOINTS=true`)
- CORS permite todos los orígenes para endpoints vulnerables
- Base de datos en memoria (se resetea en cada reinicio)
- Credenciales de demo incluidas

### Si Necesitas Mayor Seguridad

1. **Deshabilitar endpoints vulnerables:**

   ```bash
   # Editar cloudbuild.yaml y cambiar:
   _ENABLE_VULNERABLE: "false"
   ```

2. **Restringir acceso a Cloud Run:**

   ```bash
   # Eliminar --allow-unauthenticated
   # Requiere autenticación para acceder
   ```

3. **Rotar secretos regularmente:**
   ```bash
   NEW_SECRET=$(openssl rand -base64 32)
   echo -n "$NEW_SECRET" | gcloud secrets versions add jwt-secret --data-file=-
   ```

## 🐛 Solución de Problemas

### Error: "API not enabled"

```bash
gcloud services enable [API_NAME].googleapis.com
```

### Error: "Permission denied"

Verifica que el service account de Cloud Build tenga los permisos necesarios:

```bash
./scripts/setup-gcp.sh  # Ejecuta la configuración de nuevo
```

### Backend no inicia correctamente

1. Verifica los logs del servicio:

   ```bash
   gcloud run logs tail owasp-demo-backend
   ```

2. Verifica las credenciales en Secret Manager

3. Revisa los logs del servicio backend

### Frontend no puede conectarse al Backend

1. Verifica la variable de entorno `NEXT_PUBLIC_API_URL` en el servicio frontend
2. Puede necesitar redesplegar el frontend después de desplegar el backend

### Cloud Build tarda mucho tiempo

- Usa una máquina más potente editando `cloudbuild.yaml`:
  ```yaml
  options:
    machineType: "E2_HIGHCPU_8" # o N1_HIGHCPU_32 para más velocidad
  ```

## 📚 Recursos Adicionales

- [Documentación de Cloud Run](https://cloud.google.com/run/docs)
- [Documentación de Cloud SQL](https://cloud.google.com/sql/docs)
- [Documentación de Cloud Build](https://cloud.google.com/build/docs)
- [Best Practices de GCP](https://cloud.google.com/architecture/framework)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `gcloud run logs read owasp-demo-backend --limit=100`
2. Verifica el estado de los servicios en [Cloud Console](https://console.cloud.google.com)
3. Consulta el [README principal](README.md)

---

**Recuerda**: Este proyecto contiene código intencionalmente vulnerable para fines educativos. No lo uses en producción.
