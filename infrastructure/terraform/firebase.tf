# Firebase Hosting site
resource "google_firebase_hosting_site" "timeintel_web" {
  provider    = google-beta
  project     = var.project_id
  site_id     = "timeintel-web"
  region      = "us-central1"
  app_id      = google_firebase_web_app.timeintel.app_id
  display_name = "TimeIntel Web"
}

# Firebase Web App
resource "google_firebase_web_app" "timeintel" {
  provider      = google-beta
  project       = var.project_id
  display_name  = "TimeIntel Web App"
  deletion_policy = "DELETE"
}

# Firebase Web App Config (for client-side initialization)
resource "google_firebase_web_app_config" "timeintel" {
  provider   = google-beta
  web_app_id = google_firebase_web_app.timeintel.app_id
  project    = var.project_id
}

# Firestore Database (for real-time updates)
resource "google_firestore_database" "timeintel" {
  provider              = google-beta
  project               = var.project_id
  name                  = "(default)"
  location_id           = var.region
  type                  = "FIRESTORE_NATIVE"
  delete_protection_enabled = var.environment == "production" ? true : false
  deletion_policy       = "DELETE"
}

# Firestore indexes for common queries
resource "google_firestore_index" "timeintel_user_tasks" {
  provider   = google-beta
  project    = var.project_id
  collection = "users"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "timeintel_tasks_status" {
  provider   = google-beta
  project    = var.project_id
  collection = "tasks"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "dueDate"
    order      = "ASCENDING"
  }
}

# Outputs
output "firebase_config" {
  value = jsonencode({
    apiKey          = "use_from_google_firebase_web_app_config"
    authDomain      = "${var.firebase_project_id}.firebaseapp.com"
    projectId       = var.project_id
    storageBucket   = "${var.firebase_project_id}.appspot.com"
    messagingSenderId = "use_from_google_firebase_web_app_config"
    appId           = google_firebase_web_app.timeintel.app_id
  })
  description = "Firebase configuration for client-side initialization"
}

output "firebase_hosting_site_id" {
  value       = google_firebase_hosting_site.timeintel_web.site_id
  description = "Firebase Hosting site ID"
}

output "firestore_database" {
  value       = google_firestore_database.timeintel.name
  description = "Firestore database name"
}
