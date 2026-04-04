# TMC TimeIntel - Deployment Guide

## Quick Start

### Prerequisites
- GCP Project: `tmcltd-timeintel`
- gcloud CLI installed and authenticated
- Terraform 1.0+
- Docker & Docker Compose
- Git access to repository

### Step 1: Prepare GCP Project

```bash
# Set project
gcloud config set project tmcltd-timeintel

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  aiplatform.googleapis.com \
  chat.googleapis.com \
  calendar-json.googleapis.com \
  tasks.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  cloudtasks.googleapis.com \
  bigquery.googleapis.com \
  firebasehosting.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  cloudscheduler.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  artifactregistry.googleapis.com \
  containerregistry.googleapis.com
```

### Step 2: Create Artifact Registry

```bash
# Create repository
gcloud artifacts repositories create timeintel \
  --repository-format=docker \
  --location=asia-south1 \
  --description="TimeIntel Docker images"

# Configure Docker auth
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

### Step 3: Infrastructure Deployment

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Copy and customize variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values:
# - backend_image, scheduler_image, chatbot_image (Artifact Registry URIs)
# - Any custom configuration

# Plan deployment
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Save outputs
terraform output -json > outputs.json
```

### Step 4: Build and Push Images

```bash
# Backend
docker build -f infrastructure/docker/backend.Dockerfile \
  -t asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/backend:latest .
docker push asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/backend:latest

# Scheduler
docker build -f infrastructure/docker/scheduling-engine.Dockerfile \
  -t asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/scheduler:latest .
docker push asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/scheduler:latest

# Chatbot (if applicable)
docker build -f infrastructure/docker/chatbot.Dockerfile \
  -t asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/chatbot:latest .
docker push asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/chatbot:latest
```

### Step 5: Deploy Cloud Run Services

```bash
# Backend API
gcloud run deploy timeintel-api \
  --image asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/backend:latest \
  --region asia-south1 \
  --platform managed \
  --memory 512Mi \
  --cpu 1 \
  --allow-unauthenticated \
  --service-account timeintel-api-sa@tmcltd-timeintel.iam.gserviceaccount.com \
  --set-env-vars NODE_ENV=production,GCP_PROJECT_ID=tmcltd-timeintel

# Scheduler
gcloud run deploy timeintel-scheduler \
  --image asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/scheduler:latest \
  --region asia-south1 \
  --platform managed \
  --memory 1Gi \
  --cpu 2 \
  --timeout 3600 \
  --no-allow-unauthenticated \
  --service-account timeintel-scheduler-sa@tmcltd-timeintel.iam.gserviceaccount.com \
  --set-env-vars GCP_PROJECT_ID=tmcltd-timeintel,LOG_LEVEL=info

# Chatbot
gcloud run deploy timeintel-chat-webhook \
  --image asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/chatbot:latest \
  --region asia-south1 \
  --platform managed \
  --memory 256Mi \
  --cpu 1 \
  --allow-unauthenticated \
  --service-account timeintel-chatbot-sa@tmcltd-timeintel.iam.gserviceaccount.com
```

### Step 6: Configure Secrets

```bash
# Store database password
gcloud secrets create cloud-sql-password --data-file=- << 'SECRET'
[enter your secure password]
SECRET

# Store Redis auth
gcloud secrets create redis-auth-string --data-file=- << 'SECRET'
[enter your secure password]
SECRET

# Store JWT secret
gcloud secrets create jwt-secret --data-file=- << 'SECRET'
[enter your secure password]
SECRET

# Store OAuth client secret
gcloud secrets create oauth-client-secret --data-file=- << 'SECRET'
[enter your OAuth secret]
SECRET
```

### Step 7: Configure Custom Domains

#### Update DNS Records

Point these DNS records to Cloud Run:
```
api.timeintel.tmcltd.ai    → Cloud Run backend (from gcloud)
timeintel.tmcltd.ai        → Firebase Hosting
```

#### Map Custom Domains to Cloud Run

```bash
gcloud run domain-mappings create \
  --service=timeintel-api \
  --domain=api.timeintel.tmcltd.ai \
  --region=asia-south1
```

### Step 8: Deploy Frontend

```bash
cd frontend

# Build
npm ci
npm run build

# Deploy to Firebase
firebase deploy --project tmcltd-timeintel --only hosting:timeintel-web
```

### Step 9: Verify Deployment

```bash
# Check services
gcloud run services list --region asia-south1

# Test backend health
curl https://api.timeintel.tmcltd.ai/health

# Check Cloud Scheduler jobs
gcloud scheduler jobs list --location asia-south1

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

## Monitoring & Maintenance

### View Monitoring Dashboard

```bash
# Get dashboard URL
terraform output -raw monitoring_dashboard_url
```

### Troubleshooting

#### Cloud Run Deploy Failures
```bash
# Check service logs
gcloud run services describe timeintel-api --region asia-south1

# View recent revisions
gcloud run revisions list --region asia-south1 --service timeintel-api

# Stream logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=timeintel-api"
```

#### Database Connection Issues
```bash
# Check Cloud SQL status
gcloud sql instances describe timeintel-db-xxxx

# Connect to database
gcloud sql connect timeintel-db-xxxx --user=timeintel_app

# View Network Peering
gcloud compute networks peerings list --network=timeintel-vpc
```

#### Redis Connection Issues
```bash
# Check Redis instance
gcloud redis instances describe timeintel-redis --region asia-south1

# Check VPC connector
gcloud compute networks vpc-access connectors describe timeintel-connector \
  --region asia-south1
```

### Scaling

#### Adjust Cloud Run Instances

```bash
# Backend
gcloud run services update timeintel-api \
  --region asia-south1 \
  --min-instances 2 \
  --max-instances 20

# Scheduler
gcloud run services update timeintel-scheduler \
  --region asia-south1 \
  --min-instances 2 \
  --max-instances 10
```

#### Database Scaling

```bash
# Upgrade instance tier
gcloud sql instances patch timeintel-db-xxxx \
  --tier db-n1-highmem-4

# Increase storage
gcloud sql instances patch timeintel-db-xxxx \
  --backup-start-time 03:00 \
  --allocated-storage 100
```

## Disaster Recovery

### Backup Strategy

- **Database**: Automated daily at 3:00 AM UTC
- **Retention**: 30-day point-in-time recovery
- **Backup Location**: asia (multi-region)

### Restore Database

```bash
# List backups
gcloud sql backups list --instance timeintel-db-xxxx

# Restore from backup
gcloud sql backups restore [BACKUP_ID] \
  --backup-instance=timeintel-db-xxxx
```

### Disaster Recovery Checklist

- [ ] Test database restore procedure quarterly
- [ ] Verify backup retention settings
- [ ] Document all secrets in secure location
- [ ] Plan failover procedures
- [ ] Set up cross-region backup replication
- [ ] Document emergency contacts

## Cost Optimization

### Current Estimate

- **Cloud SQL**: ~$150/month (db-n1-standard-2)
- **Cloud Run**: ~$200/month (backend + scheduler)
- **Redis**: ~$30/month (1GB basic)
- **Cloud Storage**: ~$10/month
- **Data Transfer**: ~$50/month
- **Cloud Tasks**: ~$2/month
- **Cloud Scheduler**: ~$10/month

**Total**: ~$450/month

### Cost Reduction Options

1. **Use Cloud SQL Shared CPU**: ~$10-20/month
2. **Reduce Cloud Run min instances**: Auto-scaling from 0
3. **Use Redis Standard tier**: Multi-zone redundancy

## Rollback Procedures

### Rollback Cloud Run Service

```bash
# List revisions
gcloud run revisions list --region asia-south1 --service timeintel-api

# Deploy previous revision
gcloud run deploy timeintel-api \
  --region asia-south1 \
  --revision=[PREVIOUS_REVISION_ID]
```

### Rollback Terraform

```bash
cd infrastructure/terraform

# Revert to previous state
terraform plan -destroy -out=tfplan
terraform apply tfplan  # Only for complete rollback

# Or selective rollback of specific resources
terraform destroy -target=google_cloud_run_service.backend
```

## Security Checklist

- [ ] All secrets rotated in Secret Manager
- [ ] Service account permissions reviewed
- [ ] VPC network isolation verified
- [ ] SSL/TLS certificates valid
- [ ] Database encryption enabled
- [ ] IAM roles follow least privilege
- [ ] Cloud SQL private IP configured
- [ ] Firewall rules restricted
- [ ] Cloud Armor policies in place (if applicable)
- [ ] Regular security audits scheduled

## Post-Deployment

1. **Update DNS**: Configure custom domains
2. **Configure OAuth**: Set authorized redirect URIs
3. **Setup Monitoring**: Verify alert channels
4. **Import Data**: Migrate existing data if applicable
5. **Run Tests**: Execute integration tests
6. **Load Testing**: Verify performance under load
7. **User Acceptance Testing**: Validate with stakeholders
8. **Documentation**: Update runbooks and playbooks

## Support

For issues or questions:
- Email: haseeb@tmcltd.ai
- Documentation: See README.md
- Monitoring: Check Cloud Logging and Cloud Monitoring

---
**Last Updated**: April 2026
**Maintained By**: Platform Team
