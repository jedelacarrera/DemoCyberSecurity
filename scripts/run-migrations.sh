#!/bin/bash

# Script to run database migrations on Cloud SQL
# This uses Cloud SQL Proxy to connect securely

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== OWASP Demo - Database Migrations ===${NC}"
echo ""

# Check if configuration file exists
if [ -f "gcp-config.env" ]; then
    echo -e "${GREEN}Loading configuration from gcp-config.env...${NC}"
    source gcp-config.env
else
    echo -e "${RED}Error: Configuration file not found.${NC}"
    echo "Run ./scripts/setup-gcp.sh first."
    exit 1
fi

# Validate required variables
if [ -z "$PROJECT_ID" ] || [ -z "$DB_INSTANCE_NAME" ]; then
    echo -e "${RED}Error: Required environment variables not set${NC}"
    exit 1
fi

echo -e "${GREEN}Project: $PROJECT_ID${NC}"
echo -e "${GREEN}Instance: $DB_INSTANCE_NAME${NC}"
echo ""

# Check if cloud-sql-proxy is installed
if ! command -v cloud-sql-proxy &> /dev/null; then
    echo -e "${YELLOW}Cloud SQL Proxy not found. Installing...${NC}"
    
    # Detect OS
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    if [ "$ARCH" = "x86_64" ]; then
        ARCH="amd64"
    elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
        ARCH="arm64"
    fi
    
    PROXY_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.${OS}.${ARCH}"
    
    echo "Downloading from: $PROXY_URL"
    curl -o cloud-sql-proxy "$PROXY_URL"
    chmod +x cloud-sql-proxy
    sudo mv cloud-sql-proxy /usr/local/bin/
    
    echo -e "${GREEN}✓ Cloud SQL Proxy installed${NC}"
fi

echo ""
echo -e "${GREEN}Starting Cloud SQL Proxy...${NC}"

# Start Cloud SQL Proxy in background
INSTANCE_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE_NAME}"
cloud-sql-proxy "$INSTANCE_CONNECTION_NAME" &
PROXY_PID=$!

# Wait for proxy to be ready
sleep 3

echo -e "${GREEN}✓ Cloud SQL Proxy started (PID: $PROXY_PID)${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping Cloud SQL Proxy...${NC}"
    kill $PROXY_PID 2>/dev/null || true
    echo -e "${GREEN}Done!${NC}"
}

trap cleanup EXIT

# Run migrations
echo -e "${GREEN}Running database migrations...${NC}"
echo ""

cd backend

# Export database connection variables
export DB_HOST="127.0.0.1"
export DB_PORT="5432"
export DB_USER="${DB_USER}"
export DB_PASSWORD="${DB_PASSWORD}"
export DB_NAME="${DB_NAME}"
export NODE_ENV="production"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run migrations
echo -e "${GREEN}Running Sequelize migrations...${NC}"
npx sequelize-cli db:migrate

echo ""
echo -e "${YELLOW}Do you want to seed the database with demo data? (y/N):${NC}"
read -r SEED_CONFIRM

if [ "$SEED_CONFIRM" = "y" ] || [ "$SEED_CONFIRM" = "Y" ]; then
    echo -e "${GREEN}Seeding database...${NC}"
    npx sequelize-cli db:seed:all
    echo -e "${GREEN}✓ Database seeded${NC}"
fi

echo ""
echo -e "${GREEN}=== Migrations Complete! ===${NC}"
echo ""
echo -e "${YELLOW}Demo users created:${NC}"
echo "  Admin:"
echo "    Username: admin"
echo "    Password: admin123"
echo ""
echo "  Regular User:"
echo "    Username: user"
echo "    Password: user123"

