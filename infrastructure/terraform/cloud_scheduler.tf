# Cloud Scheduler Job - ProjectFlow Sync Poll (every 5 minutes)
resource "google_cloud_scheduler_job" "pf_sync_poll" {
  name             = "pf-sync-poll"
  description      = "Poll ProjectFlow API for updates every 5 minutes"
  schedule         = "*/5 * * * *"
  time_zone        = "Asia/Karachi"
  region           = var.region
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.backend.status[0].url}/api/sync/projectflow"

    headers = {
      "Content-Type"  = "application/json"
      "Authorization" = "Bearer ${random_password.scheduler_auth_token.result}"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  labels = local.common_labels
}

# Cloud Scheduler Job - Google Tasks Sync Poll (every 60 seconds)
resource "google_cloud_scheduler_job" "gtasks_poll" {
  name             = "gtasks-poll"
  description      = "Poll Google Tasks for updates every 60 seconds"
  schedule         = "* * * * *"
  time_zone        = "Asia/Karachi"
  region           = var.region
  attempt_deadline = "60s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.backend.status[0].url}/api/sync/google-tasks"

    headers = {
      "Content-Type"  = "application/json"
      "Authorization" = "Bearer ${random_password.scheduler_auth_token.result}"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  labels = local.common_labels
}

# Cloud Scheduler Job - Daily Digest (8:30 AM PKT = 3:30 UTC)
resource "google_cloud_scheduler_job" "daily_digest" {
  name             = "daily-digest"
  description      = "Send daily digest at 8:30 AM Pakistan time"
  schedule         = "30 3 * * *"
  time_zone        = "UTC"
  region           = var.region
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.backend.status[0].url}/api/notifications/daily-digest"

    headers = {
      "Content-Type"  = "application/json"
      "Authorization" = "Bearer ${random_password.scheduler_auth_token.result}"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  labels = local.common_labels
}

# Cloud Scheduler Job - Weekly Digest (Monday 8:30 AM PKT)
resource "google_cloud_scheduler_job" "weekly_digest" {
  name             = "weekly-digest"
  description      = "Send weekly digest every Monday at 8:30 AM Pakistan time"
  schedule         = "30 3 * * 1"
  time_zone        = "UTC"
  region           = var.region
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.backend.status[0].url}/api/notifications/weekly-digest"

    headers = {
      "Content-Type"  = "application/json"
      "Authorization" = "Bearer ${random_password.scheduler_auth_token.result}"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  labels = local.common_labels
}

# Cloud Scheduler Job - Google Calendar Watch Renewal (every 6 days)
resource "google_cloud_scheduler_job" "gcal_watch_renew" {
  name             = "gcal-watch-renew"
  description      = "Renew Google Calendar push notification channels every 6 days"
  schedule         = "0 2 */6 * *"
  time_zone        = "UTC"
  region           = var.region
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.backend.status[0].url}/api/sync/gcal-watch-renew"

    headers = {
      "Content-Type"  = "application/json"
      "Authorization" = "Bearer ${random_password.scheduler_auth_token.result}"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  labels = local.common_labels
}

# Cloud Scheduler Job - Deadline Check (every hour)
resource "google_cloud_scheduler_job" "deadline_check" {
  name             = "deadline-check"
  description      = "Check for approaching deadlines every hour"
  schedule         = "0 * * * *"
  time_zone        = "Asia/Karachi"
  region           = var.region
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.scheduler.status[0].url}/api/check/deadlines"

    headers = {
      "Content-Type"  = "application/json"
      "Authorization" = "Bearer ${random_password.scheduler_auth_token.result}"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  labels = local.common_labels
}

# Cloud Scheduler Job - Overdue Check (daily 9:00 AM PKT = 4:00 UTC)
resource "google_cloud_scheduler_job" "overdue_check" {
  name             = "overdue-check"
  description      = "Check for overdue tasks daily at 9:00 AM Pakistan time"
  schedule         = "0 4 * * *"
  time_zone        = "UTC"
  region           = var.region
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.scheduler.status[0].url}/api/check/overdue"

    headers = {
      "Content-Type"  = "application/json"
      "Authorization" = "Bearer ${random_password.scheduler_auth_token.result}"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  labels = local.common_labels
}

# Cloud Scheduler Job - EOD Summary (5:30 PM PKT = 12:30 UTC)
resource "google_cloud_scheduler_job" "eod_summary" {
  name             = "eod-summary"
  description      = "Send end-of-day summary at 5:30 PM Pakistan time"
  schedule         = "30 12 * * *"
  time_zone        = "UTC"
  region           = var.region
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.backend.status[0].url}/api/notifications/eod-summary"

    headers = {
      "Content-Type"  = "application/json"
      "Authorization" = "Bearer ${random_password.scheduler_auth_token.result}"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  labels = local.common_labels
}

# Scheduler authorization token
resource "random_password" "scheduler_auth_token" {
  length  = 64
  special = true
}

resource "google_secret_manager_secret" "scheduler_auth_token" {
  secret_id = "scheduler-auth-token"
  labels    = local.common_labels
}

resource "google_secret_manager_secret_version" "scheduler_auth_token" {
  secret      = google_secret_manager_secret.scheduler_auth_token.id
  secret_data = random_password.scheduler_auth_token.result
}

# Outputs
output "scheduler_auth_token_secret" {
  value       = google_secret_manager_secret.scheduler_auth_token.name
  description = "Secret Manager secret name for scheduler auth token"
  sensitive   = true
}
