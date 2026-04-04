# Service Account - Backend
resource "google_service_account" "backend_sa" {
  account_id   = "timeintel-api-sa"
  display_name = "TimeIntel Backend Service Account"
  description  = "Service account for Cloud Run backend API"
}

# Service Account - Scheduler
resource "google_service_account" "scheduler_sa" {
  account_id   = "timeintel-scheduler-sa"
  display_name = "TimeIntel Scheduler Service Account"
  description  = "Service account for Cloud Run scheduling engine"
}

# Service Account - Chatbot
resource "google_service_account" "chatbot_sa" {
  account_id   = "timeintel-chatbot-sa"
  display_name = "TimeIntel Chatbot Service Account"
  description  = "Service account for Cloud Run chatbot webhook"
}

# Backend service account IAM roles
resource "google_project_iam_member" "backend_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "backend_redis_access" {
  project = var.project_id
  role    = "roles/redis.editor"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "backend_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "backend_tasks_enqueuer" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "backend_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "backend_logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "backend_monitoring_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

# Scheduler service account IAM roles
resource "google_project_iam_member" "scheduler_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_project_iam_member" "scheduler_redis_access" {
  project = var.project_id
  role    = "roles/redis.editor"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_project_iam_member" "scheduler_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_project_iam_member" "scheduler_tasks_enqueuer" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_project_iam_member" "scheduler_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_project_iam_member" "scheduler_logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_project_iam_member" "scheduler_monitoring_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

# Chatbot service account IAM roles
resource "google_project_iam_member" "chatbot_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.chatbot_sa.email}"
}

resource "google_project_iam_member" "chatbot_logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.chatbot_sa.email}"
}

resource "google_project_iam_member" "chatbot_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.chatbot_sa.email}"
}

# Outputs
output "backend_service_account_email" {
  value       = google_service_account.backend_sa.email
  description = "Backend service account email"
}

output "scheduler_service_account_email" {
  value       = google_service_account.scheduler_sa.email
  description = "Scheduler service account email"
}

output "chatbot_service_account_email" {
  value       = google_service_account.chatbot_sa.email
  description = "Chatbot service account email"
}
