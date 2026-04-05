# Core Outputs
output "project_id_output" {
  value       = var.project_id
  description = "GCP Project ID"
}

output "region_output" {
  value       = var.region
  description = "Primary GCP Region"
}

# API Service Outputs
output "backend_service_url" {
  value       = try(google_cloud_run_service.backend.status[0].url, "not-yet-deployed")
  description = "Backend API service URL"
}

output "scheduler_service_url" {
  value       = try(google_cloud_run_service.scheduler.status[0].url, "not-yet-deployed")
  description = "Scheduler service URL"
}

output "chatbot_webhook_url" {
  value       = try(google_cloud_run_service.chatbot.status[0].url, "not-yet-deployed")
  description = "Chatbot webhook URL"
}

# Database Outputs
output "cloud_sql_connection_name" {
  value       = google_sql_database_instance.timeintel.connection_name
  description = "Cloud SQL connection name (for connection pooling)"
}

output "cloud_sql_private_ip" {
  value       = google_sql_database_instance.timeintel.private_ip_address
  description = "Cloud SQL private IP address"
}

output "cloud_sql_database_name" {
  value       = google_sql_database.timeintel_db.name
  description = "Cloud SQL database name"
}

output "cloud_sql_database_user" {
  value       = google_sql_user.timeintel_app.name
  description = "Cloud SQL database user"
}

# Redis Outputs
output "redis_host" {
  value       = google_redis_instance.timeintel.host
  description = "Redis instance host"
}

output "redis_port" {
  value       = google_redis_instance.timeintel.port
  description = "Redis instance port"
}

# VPC Outputs
output "vpc_network_name" {
  value       = google_compute_network.timeintel_vpc.name
  description = "VPC network name"
}

output "vpc_connector_name" {
  value       = google_vpc_access_connector.timeintel_connector.name
  description = "VPC Access Connector name for Cloud Run"
}

# Secret Manager Outputs
output "secrets" {
  value = {
    db_password_secret         = google_secret_manager_secret.db_password.name
    redis_url_secret           = google_secret_manager_secret.redis_url.name
    jwt_secret                 = google_secret_manager_secret.jwt_secret.name
    oauth_client_secret        = google_secret_manager_secret.oauth_client_secret.name
    projectflow_api_key        = google_secret_manager_secret.projectflow_api_key.name
    firebase_admin_key         = google_secret_manager_secret.firebase_admin_key.name
    scheduler_auth_token       = google_secret_manager_secret.scheduler_auth_token.name
  }
  description = "Secret Manager secret names"
  sensitive   = true
}

# Cloud Tasks Outputs
output "cloud_tasks_queues" {
  value = {
    calendar_webhook_queue = google_cloud_tasks_queue.calendar_webhook.name
    pf_sync_queue          = google_cloud_tasks_queue.pf_sync.name
    notification_queue     = google_cloud_tasks_queue.notification.name
    scheduling_queue       = google_cloud_tasks_queue.scheduling.name
  }
  description = "Cloud Tasks queue names"
}

# Service Account Outputs
output "service_accounts" {
  value = {
    backend_sa   = google_service_account.backend_sa.email
    scheduler_sa = google_service_account.scheduler_sa.email
    chatbot_sa   = google_service_account.chatbot_sa.email
  }
  description = "Service account emails"
}

# Firebase Outputs
output "firebase_config" {
  value = {
    projectId       = var.project_id
    storageBucket   = "${var.firebase_project_id}.appspot.com"
    messagingSenderId = "check_firebase_console"
  }
  description = "Firebase configuration values"
}

output "firebase_hosting_site_id" {
  value       = google_firebase_hosting_site.timeintel_web.site_id
  description = "Firebase Hosting site ID"
}

# BigQuery Outputs
output "bigquery_dataset_id" {
  value       = google_bigquery_dataset.timeintel_analytics.dataset_id
  description = "BigQuery analytics dataset ID"
}

# Monitoring Outputs
output "monitoring_dashboard_url" {
  value       = "https://console.cloud.google.com/monitoring/dashboards/custom/${google_monitoring_dashboard.timeintel_operations.id}?project=${var.project_id}"
  description = "URL to the custom monitoring dashboard"
}

# Uptime checks commented out - configure via Console after Load Balancer setup
# output "uptime_checks" { ... }

# Cloud Scheduler Jobs
output "cloud_scheduler_jobs" {
  value = {
    pf_sync_poll      = google_cloud_scheduler_job.pf_sync_poll.name
    gtasks_poll       = google_cloud_scheduler_job.gtasks_poll.name
    daily_digest      = google_cloud_scheduler_job.daily_digest.name
    weekly_digest     = google_cloud_scheduler_job.weekly_digest.name
    gcal_watch_renew  = google_cloud_scheduler_job.gcal_watch_renew.name
    deadline_check    = google_cloud_scheduler_job.deadline_check.name
    overdue_check     = google_cloud_scheduler_job.overdue_check.name
    eod_summary       = google_cloud_scheduler_job.eod_summary.name
  }
  description = "Cloud Scheduler job names"
}

# Summary Output
output "deployment_summary" {
  value = {
    environment      = var.environment
    region           = var.region
    project_id       = var.project_id
    api_endpoint     = try(google_cloud_run_service.backend.status[0].url, "not-yet-deployed")
    admin_email      = var.alert_email
    deployment_date  = timestamp()
  }
  description = "Deployment summary information"
}
