#!/bin/bash

# Development script for OWASP Demo
# This script starts both frontend and backend in development mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== OWASP Demo - Development Mode ===${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}Starting development servers...${NC}"
echo ""
echo -e "${YELLOW}Frontend will be available at: http://localhost:3100${NC}"
echo -e "${YELLOW}Backend will be available at: http://localhost:3101${NC}"
echo ""

# Function to start backend
start_backend() {
    echo -e "${GREEN}Starting Backend (Port 3101)...${NC}"
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
}

# Function to start frontend
start_frontend() {
    echo -e "${GREEN}Starting Frontend (Port 3100)...${NC}"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}Development servers stopped.${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start servers
start_backend
sleep 2
start_frontend

echo ""
echo -e "${GREEN}✅ Development servers started!${NC}"
echo ""
echo -e "${BLUE}Available URLs:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3100${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:3101${NC}"
echo -e "  Health:   ${GREEN}http://localhost:3101/health${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Wait for user to stop
wait
