variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "tmcltd-timeintel"
}

variable "region" {
  description = "GCP Region (Asia South 1 - closest to Pakistan)"
  type        = string
  default     = "asia-south1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "admin_email" {
  description = "Admin email for notifications and alerts"
  type        = string
  default     = "haseeb@tmcltd.ai"
}

# Database variables
variable "db_instance_tier" {
  description = "Cloud SQL instance machine type"
  type        = string
  default     = "db-n1-standard-2"
}

variable "db_storage_size" {
  description = "Cloud SQL allocated storage in GB"
  type        = number
  default     = 50
}

variable "db_storage_type" {
  description = "Cloud SQL storage type"
  type        = string
  default     = "PD_SSD"
}

variable "db_backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "db_backup_location" {
  description = "Location for database backups"
  type        = string
  default     = "asia"
}

# Cloud Run variables
variable "backend_min_instances" {
  description = "Minimum instances for backend service"
  type        = number
  default     = 1
}

variable "backend_max_instances" {
  description = "Maximum instances for backend service"
  type        = number
  default     = 10
}

variable "backend_memory" {
  description = "Memory for backend Cloud Run instances"
  type        = string
  default     = "512Mi"
}

variable "backend_cpu" {
  description = "CPU for backend Cloud Run instances"
  type        = string
  default     = "1"
}

variable "scheduler_min_instances" {
  description = "Minimum instances for scheduler service"
  type        = number
  default     = 1
}

variable "scheduler_max_instances" {
  description = "Maximum instances for scheduler service"
  type        = number
  default     = 5
}

variable "scheduler_memory" {
  description = "Memory for scheduler Cloud Run instances"
  type        = string
  default     = "1Gi"
}

variable "scheduler_cpu" {
  description = "CPU for scheduler Cloud Run instances"
  type        = string
  default     = "2"
}

variable "chatbot_min_instances" {
  description = "Minimum instances for chatbot webhook"
  type        = number
  default     = 0
}

variable "chatbot_max_instances" {
  description = "Maximum instances for chatbot webhook"
  type        = number
  default     = 5
}

# Redis variables
variable "redis_memory_size_gb" {
  description = "Memorystore Redis instance size in GB"
  type        = number
  default     = 1
}

variable "redis_tier" {
  description = "Memorystore Redis tier (basic or standard)"
  type        = string
  default     = "basic"
  validation {
    condition     = contains(["basic", "standard"], var.redis_tier)
    error_message = "Redis tier must be basic or standard."
  }
}

# Domain variables
variable "api_domain" {
  description = "Custom domain for API"
  type        = string
  default     = "api.timeintel.tmcltd.ai"
}

variable "web_domain" {
  description = "Custom domain for web frontend"
  type        = string
  default     = "timeintel.tmcltd.ai"
}

# Cloud Tasks variables
variable "calendar_webhook_rate" {
  description = "Calendar webhook queue rate limit (tasks/sec)"
  type        = number
  default     = 100
}

variable "pf_sync_rate" {
  description = "ProjectFlow sync queue rate limit (tasks/sec)"
  type        = number
  default     = 10
}

variable "notification_queue_rate" {
  description = "Notification queue rate limit (tasks/sec)"
  type        = number
  default     = 50
}

variable "scheduling_queue_rate" {
  description = "Scheduling queue rate limit (tasks/sec)"
  type        = number
  default     = 20
}

# Container image variables
variable "backend_image" {
  description = "Backend Docker image URI"
  type        = string
}

variable "scheduler_image" {
  description = "Scheduler Docker image URI"
  type        = string
}

variable "chatbot_image" {
  description = "Chatbot Docker image URI"
  type        = string
}

# Artifact Registry
variable "artifact_registry_location" {
  description = "Artifact Registry location"
  type        = string
  default     = "asia-south1"
}

variable "artifact_registry_repository" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "timeintel"
}

# Monitoring
variable "alert_email" {
  description = "Email for alert notifications"
  type        = string
  default     = "haseeb@tmcltd.ai"
}

variable "api_latency_threshold_ms" {
  description = "API latency threshold in milliseconds for alerting"
  type        = number
  default     = 2000
}

variable "cpu_threshold_percent" {
  description = "CPU usage threshold percentage for alerting"
  type        = number
  default     = 80
}

variable "sync_error_rate_threshold" {
  description = "Sync error rate threshold for alerting (0-1)"
  type        = number
  default     = 0.05
}

# Firebase
variable "firebase_project_id" {
  description = "Firebase project ID"
  type        = string
  default     = "tmcltd-timeintel"
}

# Tags and labels
variable "common_labels" {
  description = "Common labels for all resources"
  type        = map(string)
  default = {
    "project"     = "timeintel"
    "managed-by"  = "terraform"
    "owner"       = "platform-team"
  }
}
