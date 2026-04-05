# Cloud Tasks Queue - Calendar Webhook
resource "google_cloud_tasks_queue" "calendar_webhook" {
  name   = "calendar-webhook-queue"
  location = var.region

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

}

# Cloud Tasks Queue - ProjectFlow Sync
resource "google_cloud_tasks_queue" "pf_sync" {
  name   = "pf-sync-queue"
  location = var.region

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

}

# Cloud Tasks Queue - Notifications
resource "google_cloud_tasks_queue" "notification" {
  name   = "notification-queue"
  location = var.region

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

}

# Cloud Tasks Queue - Scheduling
resource "google_cloud_tasks_queue" "scheduling" {
  name   = "scheduling-queue"
  location = var.region

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

}


