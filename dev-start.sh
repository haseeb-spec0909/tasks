#!/bin/bash
# ============================================================================
# TMC TimeIntel - Local Development Quick Start
# Starts PostgreSQL + Redis + Backend + Scheduler using Docker Compose
# ============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}TMC TimeIntel - Local Development${NC}"
echo ""

# Check Docker
command -v docker >/dev/null 2>&1 || { echo -e "${RED}✗ Docker required${NC}"; exit 1; }
docker compose version >/dev/null 2>&1 || docker-compose version >/dev/null 2>&1 || { echo -e "${RED}✗ Docker Compose required${NC}"; exit 1; }

# Copy env files if needed
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}Created backend/.env from example - update with real values${NC}"
fi

if [ ! -f "scheduling-engine/.env" ]; then
    cp scheduling-engine/.env.example scheduling-engine/.env
    echo -e "${YELLOW}Created scheduling-engine/.env from example${NC}"
fi

if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
    echo -e "${YELLOW}Created frontend/.env.local from example - add Firebase config${NC}"
fi

# Start Docker Compose (PostgreSQL + Redis)
echo -e "${BLUE}Starting PostgreSQL and Redis...${NC}"
cd infrastructure/docker
docker compose up -d postgres redis
cd ../..

# Wait for PostgreSQL
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 3
for i in {1..30}; do
    if docker compose -f infrastructure/docker/docker-compose.yml exec -T postgres pg_isready -U timeintel_app 2>/dev/null; then
        break
    fi
    sleep 1
done
echo -e "${GREEN}✓ PostgreSQL ready${NC}"

# Run database migrations
echo -e "${BLUE}Running database migrations...${NC}"
for f in database/migrations/001_core_tables.sql \
         database/migrations/002_indexes.sql \
         database/migrations/003_functions.sql \
         database/migrations/004_seed_data.sql; do
    echo "  Running ${f}..."
    docker compose -f infrastructure/docker/docker-compose.yml exec -T postgres \
        psql -U timeintel_app -d timeintel_db -f "/docker-entrypoint-initdb.d/$(basename $f)" 2>/dev/null || \
    PGPASSWORD=dev-password psql -h localhost -p 5432 -U timeintel_app -d timeintel_db -f "$f" 2>/dev/null || true
done
echo -e "${GREEN}✓ Migrations complete${NC}"

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend && npm install && cd ..

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend && npm install && cd ..

# Install scheduling engine dependencies
echo -e "${BLUE}Installing scheduling engine dependencies...${NC}"
cd scheduling-engine && pip install -r requirements.txt --break-system-packages 2>/dev/null || pip install -r requirements.txt && cd ..

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Local Environment Ready!                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Start each service in a separate terminal:"
echo ""
echo -e "  ${BLUE}Terminal 1 - Backend API:${NC}"
echo -e "    cd backend && npm run dev"
echo -e "    → http://localhost:8080"
echo ""
echo -e "  ${BLUE}Terminal 2 - Scheduling Engine:${NC}"
echo -e "    cd scheduling-engine && uvicorn main:app --reload --port 8081"
echo -e "    → http://localhost:8081"
echo ""
echo -e "  ${BLUE}Terminal 3 - Frontend:${NC}"
echo -e "    cd frontend && npm run dev"
echo -e "    → http://localhost:5173"
echo ""
echo -e "  ${YELLOW}Services running:${NC}"
echo -e "    PostgreSQL: localhost:5432 (user: timeintel_app, db: timeintel_db)"
echo -e "    Redis:      localhost:6379"
echo ""
echo -e "  ${YELLOW}To stop:${NC} cd infrastructure/docker && docker compose down"
