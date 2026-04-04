# Cloud Tasks Queue - Calendar Webhook
resource "google_cloud_tasks_queue" "calendar_webhook" {
  name   = "calendar-webhook-queue"
  region = var.region

  rate_limits {
    max_concurrent_dispatches = 50
    max_dispatches_per_second = var.calendar_webhook_rate
  }

  retry_config {
    max_attempts       = 5
    max_backoff        = "3600s"
    max_doublings      = 16
    min_backoff        = "0.1s"
  }

  labels = local.common_labels
}

# Cloud Tasks Queue - ProjectFlow Sync
resource "google_cloud_tasks_queue" "pf_sync" {
  name   = "pf-sync-queue"
  region = var.region

  rate_limits {
    max_concurrent_dispatches = 5
    max_dispatches_per_second = var.pf_sync_rate
  }

  retry_config {
    max_attempts       = 3
    max_backoff        = "600s"
    max_doublings      = 5
    min_backoff        = "1s"
  }

  labels = local.common_labels
}

# Cloud Tasks Queue - Notifications
resource "google_cloud_tasks_queue" "notification" {
  name   = "notification-queue"
  region = var.region

  rate_limits {
    max_concurrent_dispatches = 20
    max_dispatches_per_second = var.notification_queue_rate
  }

  retry_config {
    max_attempts       = 5
    max_backoff        = "3600s"
    max_doublings      = 16
    min_backoff        = "0.1s"
  }

  labels = local.common_labels
}

# Cloud Tasks Queue - Scheduling
resource "google_cloud_tasks_queue" "scheduling" {
  name   = "scheduling-queue"
  region = var.region

  rate_limits {
    max_concurrent_dispatches = 10
    max_dispatches_per_second = var.scheduling_queue_rate
  }

  retry_config {
    max_attempts       = 5
    max_backoff        = "3600s"
    max_doublings      = 16
    min_backoff        = "0.1s"
  }

  labels = local.common_labels
}

# Outputs
output "calendar_webhook_queue_name" {
  value       = google_cloud_tasks_queue.calendar_webhook.name
  description = "Calendar webhook queue name"
}

output "pf_sync_queue_name" {
  value       = google_cloud_tasks_queue.pf_sync.name
  description = "ProjectFlow sync queue name"
}

output "notification_queue_name" {
  value       = google_cloud_tasks_queue.notification.name
  description = "Notification queue name"
}

output "scheduling_queue_name" {
  value       = google_cloud_tasks_queue.scheduling.name
  description = "Scheduling queue name"
}
