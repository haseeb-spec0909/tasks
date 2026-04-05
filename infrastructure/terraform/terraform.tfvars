# GCP Configuration
project_id  = "tmcltd-timeintel"
region      = "asia-south1"
environment = "production"

# Admin Configuration
admin_email = "haseeb@tmcltd.ai"

# Database Configuration
db_instance_tier   = "db-n1-standard-2"
db_storage_size    = 50
db_storage_type    = "PD_SSD"
db_backup_enabled  = true
db_backup_location = "asia"

# Cloud Run - Backend Configuration
backend_min_instances = 1
backend_max_instances = 10
backend_memory        = "512Mi"
backend_cpu           = "1"

# Cloud Run - Scheduler Configuration
scheduler_min_instances = 1
scheduler_max_instances = 5
scheduler_memory        = "1Gi"
scheduler_cpu           = "2"

# Cloud Run - Chatbot Configuration
chatbot_min_instances = 0
chatbot_max_instances = 5

# Redis Configuration
redis_memory_size_gb = 1
redis_tier           = "basic"

# Domain Configuration
api_domain = "api.timeintel.tmcltd.ai"
web_domain = "timeintel.tmcltd.ai"

# Cloud Tasks Rate Limits
calendar_webhook_rate   = 100
pf_sync_rate            = 10
notification_queue_rate = 50
scheduling_queue_rate   = 20

# Container Image URIs
backend_image   = "asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/backend:latest"
scheduler_image = "asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/scheduler:latest"
chatbot_image   = "asia-south1-docker.pkg.dev/tmcltd-timeintel/timeintel/chatbot:latest"

# Artifact Registry
artifact_registry_location   = "asia-south1"
artifact_registry_repository = "timeintel"

# Monitoring Configuration
alert_email                 = "haseeb@tmcltd.ai"
api_latency_threshold_ms    = 2000
cpu_threshold_percent       = 80
sync_error_rate_threshold   = 0.05

# Firebase Configuration
firebase_project_id = "tmcltd-timeintel"

# Resource Labels
common_labels = {
  "project"     = "timeintel"
  "managed-by"  = "terraform"
  "owner"       = "platform-team"
  "cost-center" = "engineering"
}
