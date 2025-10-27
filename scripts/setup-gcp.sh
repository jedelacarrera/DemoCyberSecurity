#!/bin/bash

# Setup script for GCP resources
# This script creates the necessary GCP infrastructure before the first deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== OWASP Demo - GCP Setup ===${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}No project configured. Please enter your GCP Project ID:${NC}"
    read -r PROJECT_ID
    gcloud config set project "$PROJECT_ID"
fi

echo -e "${GREEN}Using project: $PROJECT_ID${NC}"
echo ""

# Set default region
REGION="us-central1"
echo -e "${YELLOW}Default region: $REGION${NC}"
echo -e "Press Enter to continue or type a different region:"
read -r INPUT_REGION
if [ ! -z "$INPUT_REGION" ]; then
    REGION="$INPUT_REGION"
fi

echo ""
echo -e "${GREEN}Step 1: Enabling required APIs...${NC}"

gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    --project="$PROJECT_ID"

echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

# Create Artifact Registry repository
echo -e "${GREEN}Step 2: Creating Artifact Registry repository...${NC}"

REPO_NAME="owasp-demo"
if gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" &> /dev/null; then
    echo -e "${YELLOW}Repository already exists, skipping...${NC}"
else
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="OWASP Demo Docker Repository" \
        --project="$PROJECT_ID"
    echo -e "${GREEN}✓ Artifact Registry repository created${NC}"
fi

echo ""

echo -e "${YELLOW}Note: Using in-memory SQLite database - no Cloud SQL required!${NC}"
echo ""

# Create secrets in Secret Manager
echo -e "${GREEN}Step 3: Creating secrets...${NC}"

JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &> /dev/null; then
        echo -e "${YELLOW}Secret $secret_name already exists, updating...${NC}"
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" \
            --data-file=- \
            --project="$PROJECT_ID"
    else
        echo -n "$secret_value" | gcloud secrets create "$secret_name" \
            --data-file=- \
            --replication-policy="automatic" \
            --project="$PROJECT_ID"
    fi
}

create_or_update_secret "jwt-secret" "$JWT_SECRET"
create_or_update_secret "session-secret" "$SESSION_SECRET"

echo -e "${GREEN}✓ Secrets created${NC}"
echo ""

# Grant Cloud Build necessary permissions
echo -e "${GREEN}Step 4: Configuring Cloud Build permissions...${NC}"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$CLOUD_BUILD_SA" \
    --role="roles/run.admin" \
    --condition=None

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$CLOUD_BUILD_SA" \
    --role="roles/iam.serviceAccountUser" \
    --condition=None

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$CLOUD_BUILD_SA" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None

echo -e "${GREEN}✓ Cloud Build permissions configured${NC}"
echo ""

# Grant Cloud Run service account necessary permissions
echo -e "${GREEN}Step 5: Configuring Cloud Run permissions...${NC}"

# Get the default compute service account
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None

echo -e "${GREEN}✓ Cloud Run permissions configured${NC}"
echo ""

# Configure Docker authentication
echo -e "${GREEN}Step 6: Configuring Docker for Artifact Registry...${NC}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
echo -e "${GREEN}✓ Docker configured${NC}"
echo ""

# Save configuration to file
CONFIG_FILE="gcp-config.env"
cat > "$CONFIG_FILE" <<EOF
# GCP Configuration for OWASP Demo
# Generated: $(date)

export PROJECT_ID="$PROJECT_ID"
export REGION="$REGION"
export REPOSITORY="$REPO_NAME"
export JWT_SECRET="$JWT_SECRET"
export SESSION_SECRET="$SESSION_SECRET"

# Service names
export SERVICE_NAME_BACKEND="owasp-demo-backend"
export SERVICE_NAME_FRONTEND="owasp-demo-frontend"
export SERVICE_NAME_ATTACKER="owasp-demo-attacker"
EOF

echo -e "${GREEN}✓ Configuration saved to $CONFIG_FILE${NC}"
echo ""

echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo -e "${YELLOW}Important information:${NC}"
echo "1. Configuration saved in: ${GREEN}$CONFIG_FILE${NC}"
echo "2. JWT Secret: ${GREEN}$JWT_SECRET${NC}"
echo "3. Session Secret: ${GREEN}$SESSION_SECRET${NC}"
echo ""
echo -e "${YELLOW}Database: ${GREEN}SQLite (in-memory)${NC}"
echo "  - No Cloud SQL costs!"
echo "  - Fresh demo data on each instance start"
echo "  - Perfect for demos and development"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run: ${GREEN}source $CONFIG_FILE${NC}"
echo "2. Deploy with: ${GREEN}./scripts/deploy.sh${NC}"
echo "   OR use Cloud Build: ${GREEN}gcloud builds submit --config cloudbuild.yaml${NC}"
echo ""
echo -e "${RED}⚠️  Keep $CONFIG_FILE secure and do not commit it to git!${NC}"

