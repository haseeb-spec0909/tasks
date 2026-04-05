# Notification channel for alerts
resource "google_monitoring_notification_channel" "email" {
  display_name = "TimeIntel Admin Email"
  type         = "email"
  labels = {
    email_address = var.alert_email
  }
  enabled = true
}

# TODO: Uptime checks require public endpoints or authenticated probes.
# Configure these via GCP Console after setting up custom domain with Load Balancer.
# Commented out because IAM-protected Cloud Run services can't be probed directly.
#
# resource "google_monitoring_uptime_check_config" "backend_health" { ... }
# resource "google_monitoring_uptime_check_config" "scheduler_health" { ... }

# Alert Policy - API Latency
resource "google_monitoring_alert_policy" "api_latency" {
  display_name = "TimeIntel API Latency High"
  combiner     = "OR"

  conditions {
    display_name = "API Response Latency > 2s"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\" AND metadata.user_labels.service=\"timeintel-api\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.api_latency_threshold_ms

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_95"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
  enabled               = true
}

# Alert Policy - Sync Error Rate
resource "google_monitoring_alert_policy" "sync_error_rate" {
  display_name = "TimeIntel Sync Error Rate High"
  combiner     = "OR"

  conditions {
    display_name = "Sync Error Rate > 5%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND resource.labels.service_name=\"timeintel-scheduler\" AND metric.labels.response_code_class!=\"2xx\""
      duration        = "600s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.sync_error_rate_threshold * 100

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
  enabled               = true
}

# Alert Policy - Cloud SQL CPU
resource "google_monitoring_alert_policy" "cloud_sql_cpu" {
  display_name = "TimeIntel Cloud SQL CPU High"
  combiner     = "OR"

  conditions {
    display_name = "Cloud SQL CPU Usage > 80%"

    condition_threshold {
      filter          = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\" AND resource.labels.database_id=\"${var.project_id}:timeintel-db-${local.service_name_suffix}\""
      duration        = "600s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.cpu_threshold_percent / 100

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
  enabled               = true
}

# Alert Policy - Scheduling Failures
resource "google_monitoring_alert_policy" "scheduling_failures" {
  display_name = "TimeIntel Scheduling Failures"
  combiner     = "OR"

  conditions {
    display_name = "Scheduling Job Failures"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND resource.labels.service_name=\"timeintel-scheduler\" AND metric.labels.response_code_class=\"5xx\""
      duration        = "600s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
  enabled               = true
}

# Custom Dashboard
resource "google_monitoring_dashboard" "timeintel_operations" {
  dashboard_json = jsonencode({
    displayName = "TimeIntel Operations Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Backend API Requests"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metadata.user_labels.service=\"timeintel-api\""
                      aggregation = {
                        alignmentPeriod  = "60s"
                        perSeriesAligner = "ALIGN_RATE"
                      }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "API Latency (p95)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\" AND metadata.user_labels.service=\"timeintel-api\""
                      aggregation = {
                        alignmentPeriod   = "60s"
                        perSeriesAligner  = "ALIGN_PERCENTILE_95"
                      }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Cloud SQL Connections"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/network/connections\""
                      aggregation = {
                        alignmentPeriod  = "60s"
                        perSeriesAligner = "ALIGN_MEAN"
                      }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Cloud SQL CPU"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\""
                      aggregation = {
                        alignmentPeriod  = "60s"
                        perSeriesAligner = "ALIGN_MEAN"
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })
}

# Outputs
output "monitoring_notification_channel_id" {
  value       = google_monitoring_notification_channel.email.id
  description = "Monitoring notification channel ID"
}

output "dashboard_id" {
  value       = google_monitoring_dashboard.timeintel_operations.id
  description = "Operations dashboard ID"
}
