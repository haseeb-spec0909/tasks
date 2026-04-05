# Cloud Run service - Backend API
resource "google_cloud_run_service" "backend" {
  name     = "timeintel-api"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.backend_sa.email

      containers {
        image = var.backend_image

        resources {
          limits = {
            cpu    = var.backend_cpu
            memory = var.backend_memory
          }
        }

        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.db_connection_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "REDIS_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.redis_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.jwt_secret.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "FIREBASE_PROJECT_ID"
          value = var.firebase_project_id
        }

        env {
          name = "OAUTH_CLIENT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.oauth_client_secret.secret_id
              key  = "latest"
            }
          }
        }

        ports {
          container_port = 8080
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"      = var.backend_min_instances
        "autoscaling.knative.dev/maxScale"      = var.backend_max_instances
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.timeintel_connector.id
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_secret_manager_secret_version.db_connection_url,
    google_secret_manager_secret_version.redis_url,
  ]
}

# Cloud Run service - Scheduling Engine
resource "google_cloud_run_service" "scheduler" {
  name     = "timeintel-scheduler"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.scheduler_sa.email
      timeout_seconds      = 3600

      containers {
        image = var.scheduler_image

        resources {
          limits = {
            cpu    = var.scheduler_cpu
            memory = var.scheduler_memory
          }
        }

        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.db_connection_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "REDIS_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.redis_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }

        env {
          name  = "LOG_LEVEL"
          value = "info"
        }

        ports {
          container_port = 8080
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"      = var.scheduler_min_instances
        "autoscaling.knative.dev/maxScale"      = var.scheduler_max_instances
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.timeintel_connector.id
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_secret_manager_secret_version.db_connection_url,
    google_secret_manager_secret_version.redis_url,
  ]
}

# Cloud Run service - Chat Webhook
resource "google_cloud_run_service" "chatbot" {
  name     = "timeintel-chat-webhook"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.chatbot_sa.email

      containers {
        image = var.chatbot_image

        resources {
          limits = {
            cpu    = "1"
            memory = "256Mi"
          }
        }

        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }

        ports {
          container_port = 8080
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"      = var.chatbot_min_instances
        "autoscaling.knative.dev/maxScale"      = var.chatbot_max_instances
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.timeintel_connector.id
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# IAM bindings for Cloud Run services
# Using domain-restricted sharing per org policy (allUsers not permitted)
resource "google_cloud_run_service_iam_member" "backend_invoker" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "domain:tmcltd.ai"
}

resource "google_cloud_run_service_iam_member" "scheduler_invoker" {
  service  = google_cloud_run_service.scheduler.name
  location = google_cloud_run_service.scheduler.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_cloud_run_service_iam_member" "chatbot_invoker" {
  service  = google_cloud_run_service.chatbot.name
  location = google_cloud_run_service.chatbot.location
  role     = "roles/run.invoker"
  member   = "domain:tmcltd.ai"
}
