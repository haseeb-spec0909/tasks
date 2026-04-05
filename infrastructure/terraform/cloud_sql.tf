# Cloud SQL instance for PostgreSQL
resource "google_sql_database_instance" "timeintel" {
  name             = "timeintel-db-${local.service_name_suffix}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_instance_tier
    availability_type = "REGIONAL"
    disk_type         = var.db_storage_type
    disk_size         = var.db_storage_size

    database_flags {
      name  = "max_connections"
      value = "200"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      query_plans_per_minute  = 5
    }

    backup_configuration {
      enabled                        = var.db_backup_enabled
      start_time                     = "03:00"
      location                       = var.db_backup_location
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.timeintel_vpc.id
      require_ssl     = true

      # Using private IP via VPC connector. If public IP access is needed,
      # add specific office IP addresses here instead of 0.0.0.0/0
      # Example:
      # authorized_networks {
      #   name  = "office-primary"
      #   value = "203.0.113.0/24"
      # }
    }
  }

  deletion_protection = var.environment == "production" ? true : false

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# PostgreSQL database
resource "google_sql_database" "timeintel_db" {
  name     = "timeintel_db"
  instance = google_sql_database_instance.timeintel.name
  charset  = "UTF8"

  depends_on = [google_sql_database_instance.timeintel]
}

# Database user with password from Secret Manager
resource "google_sql_user" "timeintel_app" {
  name     = "timeintel_app"
  instance = google_sql_database_instance.timeintel.name
  password = random_password.db_password.result
}

# Generate random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store database password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "cloud-sql-password"

  labels = local.common_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

