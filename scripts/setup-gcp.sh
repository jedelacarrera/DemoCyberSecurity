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
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    compute.googleapis.com \
    servicenetworking.googleapis.com \
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

# Create Cloud SQL instance
echo -e "${GREEN}Step 3: Creating Cloud SQL instance...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes...${NC}"

DB_INSTANCE_NAME="owasp-demo-db"

# Check if database instance exists
if gcloud sql instances describe "$DB_INSTANCE_NAME" --project="$PROJECT_ID" &> /dev/null; then
    echo -e "${YELLOW}Database instance already exists${NC}"
    
    # Check if secret exists and get existing password
    if gcloud secrets describe "db-password" --project="$PROJECT_ID" &> /dev/null; then
        echo -e "${YELLOW}Using existing database password from Secret Manager${NC}"
        DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password" --project="$PROJECT_ID")
    else
        echo -e "${YELLOW}No existing password found, generating new one${NC}"
        DB_PASSWORD=$(openssl rand -base64 32)
    fi
else
    echo -e "${YELLOW}Creating new database instance${NC}"
    DB_PASSWORD=$(openssl rand -base64 32)
    gcloud sql instances create "$DB_INSTANCE_NAME" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="$REGION" \
        --root-password="$DB_PASSWORD" \
        --project="$PROJECT_ID"
    
    echo -e "${GREEN}✓ Cloud SQL instance created${NC}"
    echo ""
    
    # Wait for instance to be ready
    echo -e "${YELLOW}Waiting for instance to be ready...${NC}"
    gcloud sql operations wait --project="$PROJECT_ID" \
        $(gcloud sql operations list --instance="$DB_INSTANCE_NAME" \
        --filter="status:RUNNING" --format="value(name)" --limit=1) \
        2>/dev/null || true
    
    # Create application user
    gcloud sql users create owasp_user \
        --instance="$DB_INSTANCE_NAME" \
        --password="$DB_PASSWORD" \
        --project="$PROJECT_ID"
    
    # Create database
    gcloud sql databases create owasp_demo \
        --instance="$DB_INSTANCE_NAME" \
        --project="$PROJECT_ID"
    
    echo -e "${GREEN}✓ Cloud SQL instance created${NC}"
fi

echo ""

# Create secrets in Secret Manager
echo -e "${GREEN}Step 4: Creating secrets...${NC}"

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

create_or_update_secret "db-password" "$DB_PASSWORD"
create_or_update_secret "jwt-secret" "$JWT_SECRET"
create_or_update_secret "session-secret" "$SESSION_SECRET"

echo -e "${GREEN}✓ Secrets created${NC}"
echo ""

# Grant Cloud Build necessary permissions
echo -e "${GREEN}Step 5: Configuring Cloud Build permissions...${NC}"

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
    --role="roles/cloudsql.client" \
    --condition=None

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$CLOUD_BUILD_SA" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None

echo -e "${GREEN}✓ Cloud Build permissions configured${NC}"
echo ""

# Grant Cloud Run service account necessary permissions
echo -e "${GREEN}Step 6: Configuring Cloud Run permissions...${NC}"

# Get the default compute service account
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/cloudsql.client" \
    --condition=None

echo -e "${GREEN}✓ Cloud Run permissions configured${NC}"
echo ""

# Configure Docker authentication
echo -e "${GREEN}Step 7: Configuring Docker for Artifact Registry...${NC}"
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
export DB_INSTANCE_NAME="$DB_INSTANCE_NAME"
export DB_USER="owasp_user"
export DB_NAME="owasp_demo"
export DB_PASSWORD="$DB_PASSWORD"
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
echo "2. Database password: ${GREEN}$DB_PASSWORD${NC} (also saved in $CONFIG_FILE)"
echo "3. JWT Secret: ${GREEN}$JWT_SECRET${NC}"
echo "4. Session Secret: ${GREEN}$SESSION_SECRET${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run: ${GREEN}source $CONFIG_FILE${NC}"
echo "2. Deploy with: ${GREEN}./scripts/deploy.sh${NC}"
echo "   OR use Cloud Build: ${GREEN}gcloud builds submit --config cloudbuild.yaml${NC}"
echo ""
echo -e "${RED}⚠️  Keep $CONFIG_FILE secure and do not commit it to git!${NC}"

