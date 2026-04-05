# Generate random secrets
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "oauth_client_secret" {
  length  = 48
  special = true
}

resource "random_password" "projectflow_api_key" {
  length  = 48
  special = false
  upper   = true
  lower   = true
  numeric = true
}

# JWT Secret
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret"
  labels    = local.common_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# OAuth Client Secret
resource "google_secret_manager_secret" "oauth_client_secret" {
  secret_id = "oauth-client-secret"
  labels    = local.common_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "oauth_client_secret" {
  secret      = google_secret_manager_secret.oauth_client_secret.id
  secret_data = random_password.oauth_client_secret.result
}

# ProjectFlow API Key
resource "google_secret_manager_secret" "projectflow_api_key" {
  secret_id = "projectflow-api-key"
  labels    = local.common_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "projectflow_api_key" {
  secret      = google_secret_manager_secret.projectflow_api_key.id
  secret_data = random_password.projectflow_api_key.result
}

# Database Connection URL
resource "google_secret_manager_secret" "db_connection_url" {
  secret_id = "database-connection-url"
  labels    = local.common_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_connection_url" {
  secret      = google_secret_manager_secret.db_connection_url.id
  secret_data = "postgresql://timeintel_app:${random_password.db_password.result}@${google_sql_database_instance.timeintel.private_ip_address}:5432/timeintel_db?sslmode=require"
}

# Firebase Admin Key (placeholder - user should upload actual key)
resource "google_secret_manager_secret" "firebase_admin_key" {
  secret_id = "firebase-admin-key"
  labels    = local.common_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "firebase_admin_key" {
  secret      = google_secret_manager_secret.firebase_admin_key.id
  secret_data = jsonencode({
    type                        = "service_account"
    project_id                  = var.project_id
    private_key_id              = "placeholder"
    private_key                 = "placeholder"
    client_email                = "firebase-adminsdk@${var.project_id}.iam.gserviceaccount.com"
    client_id                   = "placeholder"
    auth_uri                    = "https://accounts.google.com/o/oauth2/auth"
    token_uri                   = "https://oauth2.googleapis.com/token"
    auth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs"
  })
}

# Grant access to secrets for service accounts
resource "google_secret_manager_secret_iam_member" "backend_jwt_secret" {
  secret_id = google_secret_manager_secret.jwt_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "backend_oauth_secret" {
  secret_id = google_secret_manager_secret.oauth_client_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "backend_db_secret" {
  secret_id = google_secret_manager_secret.db_connection_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "backend_redis_secret" {
  secret_id = google_secret_manager_secret.redis_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "scheduler_db_secret" {
  secret_id = google_secret_manager_secret.db_connection_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "scheduler_redis_secret" {
  secret_id = google_secret_manager_secret.redis_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "chatbot_firebase_secret" {
  secret_id = google_secret_manager_secret.firebase_admin_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.chatbot_sa.email}"
}

# Outputs
