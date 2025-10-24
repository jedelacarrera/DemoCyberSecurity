#!/bin/bash

# Deployment script using Cloud Build
# This triggers a Cloud Build to build and deploy all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== OWASP Demo - Cloud Build Deployment ===${NC}"
echo ""

# Check if configuration file exists
if [ -f "gcp-config.env" ]; then
    echo -e "${GREEN}Loading configuration from gcp-config.env...${NC}"
    source gcp-config.env
else
    echo -e "${YELLOW}Configuration file not found.${NC}"
    echo -e "Run ${GREEN}./scripts/setup-gcp.sh${NC} first to set up GCP resources."
    echo ""
    echo -e "${YELLOW}Or manually set these environment variables:${NC}"
    echo "  - PROJECT_ID"
    echo "  - REGION"
    echo "  - REPOSITORY"
    echo "  - DB_INSTANCE_NAME"
    echo "  - DB_USER"
    echo "  - DB_NAME"
    echo "  - JWT_SECRET"
    echo "  - SESSION_SECRET"
    echo ""
    exit 1
fi

# Validate required variables
if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ]; then
    echo -e "${RED}Error: Required environment variables not set${NC}"
    exit 1
fi

echo -e "${GREEN}Project ID: $PROJECT_ID${NC}"
echo -e "${GREEN}Region: $REGION${NC}"
echo ""

# Get backend URL if it exists (for frontend build)
BACKEND_URL=$(gcloud run services describe "${SERVICE_NAME_BACKEND:-owasp-demo-backend}" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)" 2>/dev/null || echo "")

if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL="https://owasp-demo-backend-XXXX-uc.a.run.app"
    echo -e "${YELLOW}Warning: Backend URL not found. Using placeholder.${NC}"
    echo -e "${YELLOW}You may need to redeploy the frontend after the backend is deployed.${NC}"
    echo ""
fi

echo -e "${GREEN}Backend URL: $BACKEND_URL${NC}"
echo ""

# Ask for confirmation
echo -e "${YELLOW}This will trigger a Cloud Build to:${NC}"
echo "  1. Build Docker images for backend, frontend, and attacker"
echo "  2. Push images to Artifact Registry"
echo "  3. Deploy services to Cloud Run"
echo ""
echo -e "${YELLOW}Estimated time: 10-15 minutes${NC}"
echo ""
echo -e "Continue? (Y/n): "
read -r CONFIRM

if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Starting Cloud Build...${NC}"
echo ""

# Trigger Cloud Build
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions="\
_REGION=$REGION,\
_REPOSITORY=${REPOSITORY:-owasp-demo},\
_SERVICE_NAME_BACKEND=${SERVICE_NAME_BACKEND:-owasp-demo-backend},\
_SERVICE_NAME_FRONTEND=${SERVICE_NAME_FRONTEND:-owasp-demo-frontend},\
_SERVICE_NAME_ATTACKER=${SERVICE_NAME_ATTACKER:-owasp-demo-attacker},\
_DB_INSTANCE_NAME=${DB_INSTANCE_NAME:-owasp-demo-db},\
_DB_USER=${DB_USER:-owasp_user},\
_DB_NAME=${DB_NAME:-owasp_demo},\
_DB_PASSWORD_SECRET=db-password,\
_JWT_SECRET=${JWT_SECRET},\
_SESSION_SECRET=${SESSION_SECRET},\
_ENABLE_VULNERABLE=true,\
_BACKEND_URL=$BACKEND_URL" \
    --project="$PROJECT_ID"

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""

# Get service URLs
FRONTEND_URL=$(gcloud run services describe "${SERVICE_NAME_FRONTEND:-owasp-demo-frontend}" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)" 2>/dev/null)

BACKEND_URL=$(gcloud run services describe "${SERVICE_NAME_BACKEND:-owasp-demo-backend}" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)" 2>/dev/null)

ATTACKER_URL=$(gcloud run services describe "${SERVICE_NAME_ATTACKER:-owasp-demo-attacker}" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)" 2>/dev/null)

echo -e "${GREEN}Service URLs:${NC}"
echo -e "  Frontend:  ${GREEN}$FRONTEND_URL${NC}"
echo -e "  Backend:   ${GREEN}$BACKEND_URL${NC}"
echo -e "  Attacker:  ${GREEN}$ATTACKER_URL${NC}"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit the frontend URL to access the application"
echo "2. Run database migrations:"
echo -e "   ${GREEN}./scripts/run-migrations.sh${NC}"
echo ""
echo -e "${RED}⚠️  Remember: This is a demo with intentionally vulnerable code.${NC}"
echo -e "${RED}   Do not use in production or expose sensitive data.${NC}"

