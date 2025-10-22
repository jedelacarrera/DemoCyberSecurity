# Terraform Configuration for GCP Deployment

This directory contains Terraform configuration to deploy the OWASP Vulnerabilities Demo to Google Cloud Platform.

## Architecture

The deployment creates:

- **Cloud Run Services:**

  - Frontend (Next.js application)
  - Backend (Koa API)
  - Attacker (Static site for cross-origin demos)

- **Cloud SQL:** PostgreSQL 15 database

- **Artifact Registry:** Docker image repository

- **Secret Manager:** Secure storage for sensitive values

- **IAM:** Service accounts and permissions

## Prerequisites

1. **GCP Account** with billing enabled
2. **GCP Project** created
3. **Tools installed:**
   - [gcloud CLI](https://cloud.google.com/sdk/docs/install)
   - [Terraform](https://www.terraform.io/downloads) >= 1.0
   - [Docker](https://docs.docker.com/get-docker/)

## Setup

### 1. Authenticate with GCP

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Build and Push Docker Images

First, enable Artifact Registry API:

```bash
gcloud services enable artifactregistry.googleapis.com
```

Create repository:

```bash
gcloud artifacts repositories create owasp-demo \
  --repository-format=docker \
  --location=us-central1 \
  --description="OWASP Demo Docker Repository"
```

Configure Docker:

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

Build and push images:

```bash
# Set variables
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export REPO=owasp-demo

# Backend
cd ../backend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:latest

# Frontend
cd ../frontend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://backend-url.run.app .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/frontend:latest

# Attacker
cd ../attacker
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/attacker:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/attacker:latest
```

### 3. Configure Terraform Variables

```bash
cd ../terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
project_id = "your-gcp-project-id"
region     = "us-central1"

# Generate strong passwords!
db_password    = "your-strong-db-password"
jwt_secret     = "your-jwt-secret-32-chars-min"
session_secret = "your-session-secret-32-chars"

# Set to false for production!
enable_vulnerable_endpoints = false

# Docker images
backend_image  = "us-central1-docker.pkg.dev/your-project/owasp-demo/backend:latest"
frontend_image = "us-central1-docker.pkg.dev/your-project/owasp-demo/frontend:latest"
attacker_image = "us-central1-docker.pkg.dev/your-project/owasp-demo/attacker:latest"
```

### 4. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply configuration
terraform apply
```

### 5. Run Database Migrations

After deployment, run migrations on Cloud SQL:

```bash
# Get database connection details
terraform output database_info

# Connect to Cloud SQL using Cloud SQL Proxy
cloud-sql-proxy your-project:us-central1:instance-name &

# Run migrations from backend directory
cd ../backend
DB_HOST=127.0.0.1 npm run db:migrate
DB_HOST=127.0.0.1 npm run db:seed
```

## Access Your Application

After deployment:

```bash
# Get service URLs
terraform output frontend_url
terraform output backend_url
terraform output attacker_url
```

Visit the frontend URL to access the application.

## Cost Estimation

Approximate monthly costs (with minimal usage):

- Cloud Run (3 services): ~$0-50/month (pay per use)
- Cloud SQL (db-f1-micro): ~$10-15/month
- Artifact Registry: ~$0.10/GB
- Secret Manager: ~$0.06 per secret per month

**Total:** ~$15-70/month depending on usage

## Security Considerations

### For Demo Environments

The current configuration is optimized for demos:

- ✅ Public Cloud SQL IP (simplified connectivity)
- ✅ Secret Manager for sensitive data
- ✅ Allow all origins (CORS) for testing
- ⚠️ Vulnerable endpoints can be enabled

### For Production (Not Recommended)

If you must deploy to a production-like environment:

1. **Disable vulnerable endpoints:**

   ```hcl
   enable_vulnerable_endpoints = false
   ```

2. **Use Private IP for Cloud SQL:**

   - Enable VPC connector
   - Use private IP configuration

3. **Restrict CORS origins:**

   - Set specific allowed origins

4. **Enable database backups:**

   ```hcl
   backup_configuration {
     enabled = true
   }
   ```

5. **Use stronger instance tiers:**

   ```hcl
   tier = "db-custom-2-7680" # or higher
   ```

6. **Enable deletion protection:**
   ```hcl
   deletion_protection = true
   ```

## Maintenance

### Update Application

```bash
# Rebuild and push new images
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:v2 .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:v2

# Update terraform.tfvars with new image
backend_image = "...backend:v2"

# Apply changes
terraform apply
```

### View Logs

```bash
# Backend logs
gcloud run logs read owasp-demo-backend --limit=50

# Frontend logs
gcloud run logs read owasp-demo-frontend --limit=50
```

### Database Backup

```bash
gcloud sql backups create \
  --instance=INSTANCE_NAME \
  --project=PROJECT_ID
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning:** This will delete all data permanently!

## Troubleshooting

### Cloud Run service fails to start

1. Check logs:

   ```bash
   gcloud run logs read owasp-demo-backend --limit=100
   ```

2. Verify environment variables in Cloud Run console

3. Check database connectivity

### Database connection issues

1. Verify Cloud SQL instance is running
2. Check database credentials in Secret Manager
3. Ensure Cloud Run has Cloud SQL client role

### Image push fails

1. Verify authentication:

   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```

2. Check repository exists:
   ```bash
   gcloud artifacts repositories list
   ```

## Support

For issues specific to this deployment:

- Check [main README](../README.md)
- Review GCP documentation
- Check Cloud Run and Cloud SQL logs

## License

MIT
