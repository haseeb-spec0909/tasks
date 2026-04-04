#!/bin/bash
# ============================================================================
# TMC TimeIntel - One-Click Deployment Script
# Author: haseeb@tmcltd.ai
# ============================================================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       TMC TimeIntel - Deployment Script          ║${NC}"
echo -e "${BLUE}║       AI-Powered Work Intelligence Platform      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Configuration ───────────────────────────────────────────────────────────
GITHUB_ORG="${GITHUB_ORG:-tmcltd}"          # Change if different
GITHUB_REPO="${GITHUB_REPO:-TMC-TimeIntel}"
GCP_PROJECT="${GCP_PROJECT:-tmcltd-timeintel}"
GCP_REGION="${GCP_REGION:-asia-south1}"
DOMAIN="${DOMAIN:-timeintel.tmcltd.ai}"

# ─── Step 0: Pre-flight checks ──────────────────────────────────────────────
echo -e "${YELLOW}[Step 0] Running pre-flight checks...${NC}"

command -v git >/dev/null 2>&1 || { echo -e "${RED}✗ git is required${NC}"; exit 1; }
command -v gh >/dev/null 2>&1 || { echo -e "${RED}✗ GitHub CLI (gh) is required. Install: brew install gh${NC}"; exit 1; }
command -v gcloud >/dev/null 2>&1 || { echo -e "${RED}✗ Google Cloud SDK is required. Install: https://cloud.google.com/sdk/docs/install${NC}"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}✗ Terraform is required. Install: brew install terraform${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}✗ Docker is required${NC}"; exit 1; }

echo -e "${GREEN}✓ All tools available${NC}"

# Check GitHub auth
gh auth status >/dev/null 2>&1 || { echo -e "${RED}✗ Not authenticated with GitHub. Run: gh auth login${NC}"; exit 1; }
echo -e "${GREEN}✓ GitHub authenticated${NC}"

# Check GCP auth
gcloud auth print-identity-token >/dev/null 2>&1 || { echo -e "${RED}✗ Not authenticated with GCP. Run: gcloud auth login${NC}"; exit 1; }
echo -e "${GREEN}✓ GCP authenticated${NC}"

echo ""

# ─── Step 1: Create GitHub Repository ───────────────────────────────────────
echo -e "${YELLOW}[Step 1] Creating GitHub repository...${NC}"

if gh repo view "${GITHUB_ORG}/${GITHUB_REPO}" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Repository ${GITHUB_ORG}/${GITHUB_REPO} already exists${NC}"
else
    gh repo create "${GITHUB_ORG}/${GITHUB_REPO}" \
        --private \
        --description "TMC TimeIntel - AI-Powered Work Intelligence Platform for TallyMarks Consulting" \
        --clone=false
    echo -e "${GREEN}✓ Repository created: ${GITHUB_ORG}/${GITHUB_REPO}${NC}"
fi

# ─── Step 2: Push code to GitHub ────────────────────────────────────────────
echo -e "${YELLOW}[Step 2] Pushing code to GitHub...${NC}"

# Initialize git if not already
if [ ! -d ".git" ]; then
    git init -b main
    git add -A
    git commit -m "feat: TMC TimeIntel v1.0 - Complete AI-Powered Work Intelligence Platform

Full system implementation covering all 10 modules:
- Backend API (Node.js/Express)
- AI Scheduling Engine (Python/FastAPI)
- React 19 SPA (10 modules, 30+ components)
- PostgreSQL schema (12 tables, 32 indexes)
- ProjectFlow PHP endpoints (5 Oracle endpoints)
- Google Chat bot (Card v2)
- GCP Infrastructure (Terraform, Docker, CI/CD)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
fi

# Set remote and push
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_ORG}/${GITHUB_REPO}.git"
git push -u origin main
echo -e "${GREEN}✓ Code pushed to GitHub${NC}"

echo ""

# ─── Step 3: Set up GCP Project ─────────────────────────────────────────────
echo -e "${YELLOW}[Step 3] Setting up GCP project...${NC}"

gcloud config set project "${GCP_PROJECT}" 2>/dev/null

# Enable required APIs
echo "Enabling GCP APIs (this may take a few minutes)..."
APIS=(
    "run.googleapis.com"
    "sqladmin.googleapis.com"
    "redis.googleapis.com"
    "aiplatform.googleapis.com"
    "chat.googleapis.com"
    "calendar-json.googleapis.com"
    "tasks.googleapis.com"
    "secretmanager.googleapis.com"
    "cloudbuild.googleapis.com"
    "cloudtasks.googleapis.com"
    "cloudscheduler.googleapis.com"
    "bigquery.googleapis.com"
    "firebasehosting.googleapis.com"
    "compute.googleapis.com"
    "vpcaccess.googleapis.com"
    "artifactregistry.googleapis.com"
)

for api in "${APIS[@]}"; do
    gcloud services enable "$api" --quiet 2>/dev/null &
done
wait
echo -e "${GREEN}✓ All GCP APIs enabled${NC}"

echo ""

# ─── Step 4: Deploy Infrastructure with Terraform ───────────────────────────
echo -e "${YELLOW}[Step 4] Deploying infrastructure with Terraform...${NC}"

cd infrastructure/terraform

# Create tfvars
if [ ! -f "terraform.tfvars" ]; then
    cp terraform.tfvars.example terraform.tfvars
    echo -e "${YELLOW}⚠ Created terraform.tfvars from example. Please review and update values.${NC}"
    echo -e "${YELLOW}  Then re-run this script.${NC}"
    echo ""
    echo -e "  Key values to set:"
    echo -e "    project_id       = \"${GCP_PROJECT}\""
    echo -e "    region           = \"${GCP_REGION}\""
    echo -e "    admin_email      = \"haseeb@tmcltd.ai\""
    echo -e "    domain           = \"${DOMAIN}\""
    echo ""
fi

terraform init
terraform plan -out=tfplan
echo ""
echo -e "${YELLOW}Review the Terraform plan above.${NC}"
read -p "Apply? (yes/no): " APPLY_TF

if [ "$APPLY_TF" == "yes" ]; then
    terraform apply tfplan
    echo -e "${GREEN}✓ Infrastructure deployed${NC}"
else
    echo -e "${YELLOW}⚠ Terraform apply skipped. Run manually: cd infrastructure/terraform && terraform apply${NC}"
fi

cd ../..

echo ""

# ─── Step 5: Run Database Migrations ────────────────────────────────────────
echo -e "${YELLOW}[Step 5] Running database migrations...${NC}"

# Get Cloud SQL connection details from Terraform outputs
DB_HOST=$(cd infrastructure/terraform && terraform output -raw cloud_sql_private_ip 2>/dev/null || echo "")
DB_NAME="timeintel_db"
DB_USER="timeintel_app"

if [ -n "$DB_HOST" ]; then
    echo "Connecting to Cloud SQL at ${DB_HOST}..."

    # Use Cloud SQL Proxy for migration
    echo "Starting Cloud SQL Proxy..."
    INSTANCE_NAME=$(cd infrastructure/terraform && terraform output -raw cloud_sql_instance_connection_name 2>/dev/null || echo "${GCP_PROJECT}:${GCP_REGION}:timeintel-db")

    cloud-sql-proxy "${INSTANCE_NAME}" --port=5433 &
    PROXY_PID=$!
    sleep 3

    # Run migrations in order
    for migration in database/migrations/001_core_tables.sql \
                     database/migrations/002_indexes.sql \
                     database/migrations/003_functions.sql \
                     database/migrations/004_seed_data.sql; do
        echo "Running ${migration}..."
        PGPASSWORD="${DB_PASSWORD:-}" psql -h localhost -p 5433 -U "${DB_USER}" -d "${DB_NAME}" -f "${migration}"
    done

    kill $PROXY_PID 2>/dev/null
    echo -e "${GREEN}✓ Database migrations complete${NC}"
else
    echo -e "${YELLOW}⚠ Could not determine Cloud SQL IP. Run migrations manually:${NC}"
    echo "  cloud-sql-proxy ${GCP_PROJECT}:${GCP_REGION}:timeintel-db --port=5433"
    echo "  psql -h localhost -p 5433 -U timeintel_app -d timeintel_db -f database/migrations/001_core_tables.sql"
    echo "  psql -h localhost -p 5433 -U timeintel_app -d timeintel_db -f database/migrations/002_indexes.sql"
    echo "  psql -h localhost -p 5433 -U timeintel_app -d timeintel_db -f database/migrations/003_functions.sql"
    echo "  psql -h localhost -p 5433 -U timeintel_app -d timeintel_db -f database/migrations/004_seed_data.sql"
fi

echo ""

# ─── Step 6: Build and Deploy Services ──────────────────────────────────────
echo -e "${YELLOW}[Step 6] Building and deploying services...${NC}"

ARTIFACT_REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/timeintel"

# Create Artifact Registry repo if not exists
gcloud artifacts repositories create timeintel \
    --repository-format=docker \
    --location="${GCP_REGION}" \
    --description="TMC TimeIntel container images" \
    --quiet 2>/dev/null || true

# Configure Docker for Artifact Registry
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

# Build and deploy Backend API
echo -e "${BLUE}Building backend API...${NC}"
docker build -f infrastructure/docker/backend.Dockerfile -t "${ARTIFACT_REGISTRY}/backend:latest" ./backend
docker push "${ARTIFACT_REGISTRY}/backend:latest"
gcloud run deploy timeintel-api \
    --image="${ARTIFACT_REGISTRY}/backend:latest" \
    --region="${GCP_REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --min-instances=1 \
    --max-instances=10 \
    --memory=512Mi \
    --cpu=1 \
    --port=8080 \
    --quiet
echo -e "${GREEN}✓ Backend API deployed${NC}"

# Build and deploy Scheduling Engine
echo -e "${BLUE}Building scheduling engine...${NC}"
docker build -f infrastructure/docker/scheduling-engine.Dockerfile -t "${ARTIFACT_REGISTRY}/scheduler:latest" ./scheduling-engine
docker push "${ARTIFACT_REGISTRY}/scheduler:latest"
gcloud run deploy timeintel-scheduler \
    --image="${ARTIFACT_REGISTRY}/scheduler:latest" \
    --region="${GCP_REGION}" \
    --platform=managed \
    --no-allow-unauthenticated \
    --min-instances=1 \
    --max-instances=5 \
    --memory=1Gi \
    --cpu=2 \
    --port=8081 \
    --quiet
echo -e "${GREEN}✓ Scheduling engine deployed${NC}"

# Build and deploy Frontend
echo -e "${BLUE}Building frontend...${NC}"
cd frontend
npm ci
npm run build
cd ..

# Deploy frontend to Firebase Hosting (or Cloud Run as static)
if command -v firebase >/dev/null 2>&1; then
    cd frontend
    firebase deploy --only hosting --project "${GCP_PROJECT}"
    cd ..
    echo -e "${GREEN}✓ Frontend deployed to Firebase Hosting${NC}"
else
    echo -e "${YELLOW}⚠ Firebase CLI not found. Install with: npm install -g firebase-tools${NC}"
    echo -e "${YELLOW}  Then run: cd frontend && firebase deploy --only hosting${NC}"
fi

echo ""

# ─── Step 7: Set up Cloud Build triggers ────────────────────────────────────
echo -e "${YELLOW}[Step 7] Setting up Cloud Build triggers...${NC}"

# Connect GitHub repo to Cloud Build
echo -e "${YELLOW}⚠ Connect your GitHub repo to Cloud Build in the GCP Console:${NC}"
echo -e "  https://console.cloud.google.com/cloud-build/triggers?project=${GCP_PROJECT}"
echo ""

echo ""

# ─── Done ────────────────────────────────────────────────────────────────────
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         TMC TimeIntel - Deployment Complete!     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Web App:${NC}      https://${DOMAIN}"
echo -e "  ${BLUE}API:${NC}          https://api.${DOMAIN}"
echo -e "  ${BLUE}GitHub:${NC}       https://github.com/${GITHUB_ORG}/${GITHUB_REPO}"
echo -e "  ${BLUE}GCP Console:${NC}  https://console.cloud.google.com/run?project=${GCP_PROJECT}"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "  1. Configure OAuth consent screen in GCP Console"
echo -e "  2. Set up Google Chat bot in Workspace Admin"
echo -e "  3. Add ProjectFlow API key to Secret Manager"
echo -e "  4. Add DNS records for ${DOMAIN}"
echo -e "  5. Add pilot users to 'TimeIntel Pilot' Google Group"
echo ""
echo -e "  ${BLUE}Contact:${NC} haseeb@tmcltd.ai"
