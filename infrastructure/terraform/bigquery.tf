# BigQuery Dataset for analytics
resource "google_bigquery_dataset" "timeintel_analytics" {
  dataset_id    = "timeintel_analytics"
  friendly_name = "TimeIntel Analytics"
  description   = "Analytics and reporting dataset for TimeIntel platform"
  location      = var.region
  default_table_expiration_ms = 7776000000 # 90 days

  access {
    role          = "OWNER"
    user_by_email = google_service_account.backend_sa.email
  }

  access {
    role          = "READER"
    user_by_email = google_service_account.scheduler_sa.email
  }

  labels = local.common_labels
}

# Daily time breakdown table
resource "google_bigquery_table" "daily_time_breakdown" {
  dataset_id = google_bigquery_dataset.timeintel_analytics.dataset_id
  table_id   = "daily_time_breakdown"

  schema = jsonencode([
    {
      name        = "date"
      type        = "DATE"
      mode        = "REQUIRED"
      description = "Date of the record"
    },
    {
      name        = "userId"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "User identifier"
    },
    {
      name        = "totalHoursWorked"
      type        = "FLOAT64"
      mode        = "NULLABLE"
      description = "Total hours worked on this date"
    },
    {
      name        = "taskCount"
      type        = "INTEGER"
      mode        = "NULLABLE"
      description = "Number of tasks completed"
    },
    {
      name        = "meetingDuration"
      type        = "FLOAT64"
      mode        = "NULLABLE"
      description = "Total meeting duration in hours"
    },
    {
      name        = "focusTimeMinutes"
      type        = "INTEGER"
      mode        = "NULLABLE"
      description = "Minutes of focused work time"
    },
    {
      name        = "createdAt"
      type        = "TIMESTAMP"
      mode        = "REQUIRED"
      description = "When this record was created"
    }
  ])

  labels = local.common_labels
}

# Weekly task statistics table
resource "google_bigquery_table" "weekly_task_stats" {
  dataset_id = google_bigquery_dataset.timeintel_analytics.dataset_id
  table_id   = "weekly_task_stats"

  schema = jsonencode([
    {
      name        = "weekStart"
      type        = "DATE"
      mode        = "REQUIRED"
      description = "Start date of the week (Monday)"
    },
    {
      name        = "userId"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "User identifier"
    },
    {
      name        = "tasksCompleted"
      type        = "INTEGER"
      mode        = "NULLABLE"
      description = "Number of tasks completed this week"
    },
    {
      name        = "tasksCreated"
      type        = "INTEGER"
      mode        = "NULLABLE"
      description = "Number of tasks created this week"
    },
    {
      name        = "averageCompletionTime"
      type        = "FLOAT64"
      mode        = "NULLABLE"
      description = "Average hours to complete a task"
    },
    {
      name        = "onTimeCompletionRate"
      type        = "FLOAT64"
      mode        = "NULLABLE"
      description = "Percentage of tasks completed on time"
    },
    {
      name        = "averagePriority"
      type        = "FLOAT64"
      mode        = "NULLABLE"
      description = "Average task priority (1-5)"
    }
  ])

  labels = local.common_labels
}

# ProjectFlow delivery metrics table
resource "google_bigquery_table" "pf_delivery_metrics" {
  dataset_id = google_bigquery_dataset.timeintel_analytics.dataset_id
  table_id   = "pf_delivery_metrics"

  schema = jsonencode([
    {
      name        = "date"
      type        = "DATE"
      mode        = "REQUIRED"
      description = "Date of the record"
    },
    {
      name        = "userId"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "User identifier"
    },
    {
      name        = "deliveryCount"
      type        = "INTEGER"
      mode        = "NULLABLE"
      description = "Number of deliveries reported"
    },
    {
      name        = "totalDeliveryValue"
      type        = "FLOAT64"
      mode        = "NULLABLE"
      description = "Total value of deliveries"
    },
    {
      name        = "averageDeliveryValue"
      type        = "FLOAT64"
      mode        = "NULLABLE"
      description = "Average delivery value"
    },
    {
      name        = "syncStatus"
      type        = "STRING"
      mode        = "NULLABLE"
      description = "Status of the last ProjectFlow sync"
    },
    {
      name        = "lastSyncTime"
      type        = "TIMESTAMP"
      mode        = "NULLABLE"
      description = "Timestamp of last sync"
    }
  ])

  labels = local.common_labels
}

# Scheduled query for daily aggregation (runs at 1 AM UTC)
# TODO: BigQuery scheduled query requires BigQuery Data Transfer Service setup.
# Configure via GCP Console: BigQuery > Scheduled Queries > Create
# The service account needs roles/bigquery.admin and the Data Transfer Service
# must be enabled with proper OAuth consent.
#
# resource "google_bigquery_data_transfer_config" "daily_aggregation" { ... }

# Outputs
output "bigquery_project_id" {
  value       = var.project_id
  description = "BigQuery project ID"
}
