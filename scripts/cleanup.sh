#!/bin/bash

# Cleanup script to delete all GCP resources
# USE WITH CAUTION - This will delete everything!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}=== OWASP Demo - CLEANUP ALL RESOURCES ===${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This will DELETE ALL resources created for this demo!${NC}"
echo ""

# Check if configuration file exists
if [ -f "gcp-config.env" ]; then
    echo -e "${GREEN}Loading configuration from gcp-config.env...${NC}"
    source gcp-config.env
else
    echo -e "${YELLOW}Configuration file not found.${NC}"
    echo "Enter your Project ID:"
    read -r PROJECT_ID
    
    echo "Enter your Region (default: us-central1):"
    read -r REGION
    REGION=${REGION:-us-central1}
    
    REPOSITORY="owasp-demo"
    DB_INSTANCE_NAME="owasp-demo-db"
    SERVICE_NAME_BACKEND="owasp-demo-backend"
    SERVICE_NAME_FRONTEND="owasp-demo-frontend"
    SERVICE_NAME_ATTACKER="owasp-demo-attacker"
fi

echo -e "${YELLOW}This will delete:${NC}"
echo "  - Cloud Run services: $SERVICE_NAME_BACKEND, $SERVICE_NAME_FRONTEND, $SERVICE_NAME_ATTACKER"
echo "  - Cloud SQL instance: $DB_INSTANCE_NAME"
echo "  - Artifact Registry repository: $REPOSITORY"
echo "  - Secret Manager secrets: db-password, jwt-secret, session-secret"
echo ""
echo -e "${RED}This action cannot be undone!${NC}"
echo ""
echo -e "Type ${RED}'DELETE'${NC} to confirm: "
read -r CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting cleanup...${NC}"
echo ""

# Delete Cloud Run services
echo -e "${GREEN}Deleting Cloud Run services...${NC}"

for service in "$SERVICE_NAME_BACKEND" "$SERVICE_NAME_FRONTEND" "$SERVICE_NAME_ATTACKER"; do
    if gcloud run services describe "$service" --region="$REGION" --project="$PROJECT_ID" &> /dev/null; then
        echo "  Deleting $service..."
        gcloud run services delete "$service" \
            --region="$REGION" \
            --project="$PROJECT_ID" \
            --quiet
    else
        echo "  $service not found, skipping..."
    fi
done

echo -e "${GREEN}✓ Cloud Run services deleted${NC}"
echo ""

# Delete Cloud SQL instance
echo -e "${GREEN}Deleting Cloud SQL instance...${NC}"

if gcloud sql instances describe "$DB_INSTANCE_NAME" --project="$PROJECT_ID" &> /dev/null; then
    # First, delete any backups
    echo "  Deleting backups..."
    gcloud sql backups list --instance="$DB_INSTANCE_NAME" --project="$PROJECT_ID" --format="value(id)" | while read -r backup_id; do
        gcloud sql backups delete "$backup_id" --instance="$DB_INSTANCE_NAME" --project="$PROJECT_ID" --quiet || true
    done
    
    echo "  Deleting instance (this may take a few minutes)..."
    gcloud sql instances delete "$DB_INSTANCE_NAME" \
        --project="$PROJECT_ID" \
        --quiet
    echo -e "${GREEN}✓ Cloud SQL instance deleted${NC}"
else
    echo "  Instance not found, skipping..."
fi

echo ""

# Delete Artifact Registry repository
echo -e "${GREEN}Deleting Artifact Registry repository...${NC}"

if gcloud artifacts repositories describe "$REPOSITORY" --location="$REGION" --project="$PROJECT_ID" &> /dev/null; then
    gcloud artifacts repositories delete "$REPOSITORY" \
        --location="$REGION" \
        --project="$PROJECT_ID" \
        --quiet
    echo -e "${GREEN}✓ Artifact Registry repository deleted${NC}"
else
    echo "  Repository not found, skipping..."
fi

echo ""

# Delete Secret Manager secrets
echo -e "${GREEN}Deleting Secret Manager secrets...${NC}"

for secret in "db-password" "jwt-secret" "session-secret"; do
    if gcloud secrets describe "$secret" --project="$PROJECT_ID" &> /dev/null; then
        echo "  Deleting $secret..."
        gcloud secrets delete "$secret" \
            --project="$PROJECT_ID" \
            --quiet
    else
        echo "  $secret not found, skipping..."
    fi
done

echo -e "${GREEN}✓ Secrets deleted${NC}"
echo ""

# Delete configuration file
if [ -f "gcp-config.env" ]; then
    echo -e "${YELLOW}Delete local configuration file? (y/N):${NC}"
    read -r DELETE_CONFIG
    
    if [ "$DELETE_CONFIG" = "y" ] || [ "$DELETE_CONFIG" = "Y" ]; then
        rm "gcp-config.env"
        echo -e "${GREEN}✓ Configuration file deleted${NC}"
    fi
fi

echo ""
echo -e "${GREEN}=== Cleanup Complete! ===${NC}"
echo ""
echo -e "${YELLOW}Note: Cloud Build logs and history are preserved.${NC}"
echo "You can view them in the Cloud Console if needed."

