# Memorystore Redis instance
resource "google_redis_instance" "timeintel" {
  name           = "timeintel-redis"
  memory_size_gb = var.redis_memory_size_gb
  tier           = var.redis_tier
  region         = var.region

  redis_version = "7"

  # Network configuration
  display_name = "TimeIntel Cache"
  network      = google_compute_network.timeintel_vpc.id

  # Redis configuration
  redis_configs = {
    maxmemory-policy = "allkeys-lru"
    databases        = "16"
  }

  # Authorization
  auth_enabled = true

  # Maintenance window
  maintenance_policy {
    weekly_maintenance_window {
      day        = "SUNDAY"
      start_time {
        hours   = 4
        minutes = 0
      }
    }
  }

  labels = local.common_labels
}

# Generate auth string for Redis
resource "random_password" "redis_auth" {
  length  = 32
  special = true
}

# Store Redis auth string in Secret Manager
resource "google_secret_manager_secret" "redis_auth_string" {
  secret_id = "redis-auth-string"

  labels = local.common_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "redis_auth_string" {
  secret      = google_secret_manager_secret.redis_auth_string.id
  secret_data = random_password.redis_auth.result
}

# Construct Redis URL for Secret Manager
resource "google_secret_manager_secret" "redis_url" {
  secret_id = "redis-url"

  labels = local.common_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "redis_url" {
  secret      = google_secret_manager_secret.redis_url.id
  secret_data = "redis://:${random_password.redis_auth.result}@${google_redis_instance.timeintel.host}:${google_redis_instance.timeintel.port}"
}

