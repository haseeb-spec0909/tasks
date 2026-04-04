# TMC TimeIntel - AI-Powered Work Intelligence Platform

TimeIntel is an intelligent work management platform that leverages AI and machine learning to provide real-time insights into work patterns, productivity metrics, and task management. Built on Google Cloud Platform with serverless architecture for scale and reliability.

## Features

- **Real-time Task Management**: Seamless integration with Google Tasks and ProjectFlow
- **AI-Powered Insights**: Gemini-powered analysis of work patterns and productivity
- **Calendar Integration**: Deep integration with Google Calendar for context-aware scheduling
- **Automated Workflows**: Cloud Scheduler-driven automation for recurring tasks
- **Smart Notifications**: Intelligent digest generation and timely alerts
- **Analytics Dashboard**: BigQuery-backed analytics for work intelligence
- **Google Chat Integration**: Direct access to TimeIntel through Google Chat
- **Multi-timezone Support**: Full support for distributed teams across timezones

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Firebase Hosting)                 │
│                      React + TypeScript                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Cloud Run API  │
                    │   (Node.js 20)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼──┐           ┌─────▼──────┐       ┌────▼────┐
    │Cloud │           │  Cloud SQL  │       │  Redis  │
    │Tasks │           │ (PostgreSQL)│       │ (Cache) │
    └──────┘           └─────┬──────┘       └─────────┘
        │                    │
        └────────────────────┴─────────────────────┐
                             │                     │
                    ┌────────▼────────┐      ┌──────▼────┐
                    │Cloud Scheduler  │      │  Firestore│
                    │   (Cron Jobs)   │      │(Real-time)│
                    └─────────────────┘      └───────────┘
                             │
                    ┌────────▼──────────┐
                    │Cloud Run Scheduler│
                    │  (Python 3.11)    │
                    └───────────────────┘

External Integrations:
├─ Google Calendar (via Watch API)
├─ Google Tasks (via Cloud Tasks)
├─ ProjectFlow API (via HTTP)
├─ Vertex AI / Gemini (for AI insights)
└─ Google Chat (webhooks)

Analytics:
└─ BigQuery (data warehouse)
```

## Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js / Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL 15 (Cloud SQL)
- **Cache**: Redis 7 (Memorystore)

### Scheduling Engine
- **Runtime**: Python 3.11
- **Framework**: FastAPI / Uvicorn
- **Async**: asyncio / Celery
- **Scheduling**: APScheduler / schedule

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build**: Vite / Next.js
- **Hosting**: Firebase Hosting
- **State**: Redux / Zustand

### Infrastructure
- **Platform**: Google Cloud Platform
- **Compute**: Cloud Run (serverless)
- **Databases**: Cloud SQL, Firestore
- **Cache**: Memorystore Redis
- **Task Queue**: Cloud Tasks
- **Scheduling**: Cloud Scheduler
- **Analytics**: BigQuery
- **IaC**: Terraform 1.0+
- **CI/CD**: Cloud Build

## Directory Structure

```
TMC-TimeIntel/
├── backend/                          # Node.js backend service
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/                         # React frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── scheduling-engine/                # Python scheduling service
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── models/
│   ├── schedulers/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── chatbot/                          # Google Chat integration
│   ├── src/
│   ├── handlers/
│   └── package.json
├── projectflow-endpoints/            # ProjectFlow webhook handlers
│   └── src/
├── infrastructure/                   # IaC and deployment configs
│   ├── docker/
│   │   ├── backend.Dockerfile
│   │   ├── scheduling-engine.Dockerfile
│   │   └── docker-compose.yml
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── cloud_sql.tf
│   │   ├── cloud_run.tf
│   │   ├── vpc.tf
│   │   ├── redis.tf
│   │   ├── iam.tf
│   │   ├── secret_manager.tf
│   │   ├── cloud_tasks.tf
│   │   ├── cloud_scheduler.tf
│   │   ├── firebase.tf
│   │   ├── bigquery.tf
│   │   ├── monitoring.tf
│   │   └── terraform.tfvars.example
│   └── cloudbuild/
│       ├── cloudbuild-backend.yaml
│       ├── cloudbuild-scheduler.yaml
│       └── cloudbuild-frontend.yaml
├── database/                         # Database migrations and schemas
│   ├── migrations/
│   └── seeds/
├── docs/                             # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── .gitignore
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+ (for backend development)
- Python 3.11+ (for scheduling engine)
- Docker & Docker Compose (for local development)
- GCP Account with billing enabled
- Terraform 1.0+ (for infrastructure)
- gcloud CLI (for GCP interaction)

### Local Development Setup

#### 1. Clone the repository

```bash
git clone https://github.com/tmcltd/timeintel.git
cd TMC-TimeIntel
```

#### 2. Environment Configuration

Copy and configure environment files:

```bash
cp .env.example .env.local
# Edit .env.local with your local development values
```

Key environment variables to set:
- `GCP_PROJECT_ID`: your GCP project
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: generate a random secret
- `GOOGLE_CALENDAR_API_KEY`: from GCP Console
- `PROJECTFLOW_API_KEY`: from ProjectFlow admin

#### 3. Start Local Services

Using Docker Compose:

```bash
cd infrastructure/docker
docker-compose up -d
```

This starts:
- PostgreSQL 15
- Redis 7
- Backend API (port 8080)
- Scheduling Engine (port 8081)

#### 4. Initialize Database

```bash
# Run migrations
npm run --prefix backend migrate:latest

# Seed development data (optional)
npm run --prefix backend seed:dev
```

#### 5. Start Development Servers

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Scheduling Engine:
```bash
cd scheduling-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8081
```

Access the application at `http://localhost:3000`

### Environment Variables

See `.env.example` for all available configuration options. Key categories:

- **GCP**: Project ID, region, credentials
- **Database**: Connection strings, credentials
- **Redis**: Connection details
- **Authentication**: JWT secrets, OAuth credentials
- **Integrations**: API keys for external services
- **Feature Flags**: Enable/disable features
- **Monitoring**: Datadog, Sentry, Honeycomb keys

## Deployment

### Prerequisites for Deployment

1. GCP Project: `tmcltd-timeintel`
2. Service accounts created
3. Cloud Build repository connected
4. Artifact Registry repository: `timeintel`

### Infrastructure Deployment

#### 1. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

#### 2. Create terraform.tfvars

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit with your production values
```

#### 3. Plan Infrastructure

```bash
terraform plan -out=tfplan
```

#### 4. Apply Infrastructure

```bash
terraform apply tfplan
```

This creates:
- VPC network and subnetwork
- Cloud SQL (PostgreSQL 15)
- Cloud Run services (backend, scheduler, chatbot)
- Memorystore Redis
- Cloud Tasks queues
- Cloud Scheduler jobs
- IAM roles and service accounts
- Secrets in Secret Manager
- BigQuery dataset
- Firebase Hosting configuration
- Monitoring and alerting

#### 5. Configure Custom Domains

Update DNS records to point to Cloud Run and Firebase Hosting:

- `api.timeintel.tmcltd.ai` → Cloud Run backend
- `timeintel.tmcltd.ai` → Firebase Hosting

#### 6. Deploy Applications

Deploy via Cloud Build:

```bash
gcloud builds submit --config infrastructure/cloudbuild/cloudbuild-backend.yaml
gcloud builds submit --config infrastructure/cloudbuild/cloudbuild-scheduler.yaml
gcloud builds submit --config infrastructure/cloudbuild/cloudbuild-frontend.yaml
```

Or manually:

```bash
# Build and push Docker images
docker build -f infrastructure/docker/backend.Dockerfile -t asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/backend:latest .
docker push asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/backend:latest

# Deploy to Cloud Run
gcloud run deploy timeintel-api \
  --image asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/backend:latest \
  --region asia-south1 \
  --platform managed
```

## API Documentation

### Base URL

- Development: `http://localhost:8080`
- Production: `https://api.timeintel.tmcltd.ai`

### Authentication

All API requests require a Bearer token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Main Endpoints

#### Health Check
```
GET /health
```

#### Tasks
```
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

#### Calendar Integration
```
POST /api/sync/google-calendar
GET  /api/calendar/events
```

#### ProjectFlow Sync
```
POST /api/sync/projectflow
GET  /api/sync/projectflow/status
```

#### Notifications
```
GET  /api/notifications
POST /api/notifications/daily-digest
POST /api/notifications/eod-summary
```

#### Analytics
```
GET /api/analytics/daily-breakdown
GET /api/analytics/weekly-stats
GET /api/analytics/task-completion-rate
```

## Cloud Scheduler Jobs

The following jobs are configured:

| Job Name | Schedule | Purpose |
|----------|----------|---------|
| pf-sync-poll | Every 5 min | Poll ProjectFlow API |
| gtasks-poll | Every 60 sec | Poll Google Tasks |
| daily-digest | 8:30 AM PKT | Send daily summary |
| weekly-digest | Mon 8:30 AM | Send weekly summary |
| gcal-watch-renew | Every 6 days | Renew Calendar webhooks |
| deadline-check | Hourly | Check approaching deadlines |
| overdue-check | 9:00 AM PKT | Flag overdue tasks |
| eod-summary | 5:30 PM PKT | Send end-of-day summary |

## Monitoring & Alerts

### Cloud Monitoring

Access the custom TimeIntel Operations Dashboard:
```
https://console.cloud.google.com/monitoring/dashboards
```

### Alert Policies

Configured alerts:
- API latency > 2 seconds
- Sync error rate > 5%
- Cloud SQL CPU > 80%
- Scheduling job failures > 5/hour

Alert notifications sent to: `haseeb@tmcltd.ai`

### Logs

View logs in Cloud Logging:
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

## Contributing

### Code Style

- **Backend**: ESLint + Prettier
- **Frontend**: ESLint + Prettier
- **Python**: Black + isort + flake8

### Commit Guidelines

Follow conventional commits:
```
feat: add new feature
fix: fix a bug
docs: documentation changes
test: add/update tests
chore: maintenance tasks
```

### Testing

```bash
# Backend
npm --prefix backend run test

# Frontend
npm --prefix frontend run test

# Scheduler
cd scheduling-engine && pytest
```

## Database Schema

Key tables:

- `users` - User accounts and profiles
- `tasks` - Task management
- `task_categories` - Task organization
- `task_tags` - Task tagging system
- `schedules` - Recurring schedules
- `integrations` - Third-party integrations
- `api_keys` - API key management
- `audit_logs` - Activity audit trail
- `notifications` - Notification history
- `sync_events` - Integration sync events

See `database/migrations/` for full schema definition.

## Troubleshooting

### Common Issues

**Cannot connect to database**
```bash
# Check Cloud SQL connection
gcloud sql connect timeintel-db --user=timeintel_app

# Check VPC connector
gcloud compute networks vpc-access connectors list --region=asia-south1
```

**Redis connection failed**
```bash
# Check Memorystore instance
gcloud redis instances describe timeintel-redis --region=asia-south1
```

**Cloud Run deployment failed**
```bash
# Check service status
gcloud run services describe timeintel-api --region=asia-south1

# View recent deployments
gcloud run revisions list --region=asia-south1
```

## Security

- All data encrypted in transit (TLS 1.3)
- Database passwords stored in Secret Manager
- Service accounts with least privilege IAM roles
- VPC network isolation
- Regular security scanning via Cloud Security Command Center

## Performance

- 99.95% uptime SLA via Cloud Run
- <100ms p50 API latency
- Horizontal auto-scaling (1-10 backend instances)
- Redis caching for frequently accessed data
- BigQuery for efficient analytics

## License

Proprietary - TMC Limited

## Support & Contact

- **Platform Owner**: Platform Team
- **Admin Contact**: haseeb@tmcltd.ai
- **Support Email**: support@timeintel.tmcltd.ai
- **Documentation**: See `/docs` directory

## Changelog

See CHANGELOG.md for version history and release notes.

---

**Last Updated**: April 2026
**Platform Version**: 1.0.0
**Status**: Production Ready
