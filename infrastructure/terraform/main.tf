terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state management
  # backend "gcs" {
  #   bucket = "tmcltd-timeintel-terraform-state"
  #   prefix = "infrastructure"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "aiplatform.googleapis.com",
    "chat.googleapis.com",
    "calendar-json.googleapis.com",
    "tasks.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudtasks.googleapis.com",
    "bigquery.googleapis.com",
    "firebasehosting.googleapis.com",
    "compute.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudscheduler.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "artifactregistry.googleapis.com",
    "containerregistry.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# Random suffix for unique resource names
resource "random_string" "suffix" {
  length  = 4
  special = false
  lower   = true
  upper   = false
}

# Local values for common configuration
locals {
  environment = var.environment
  region      = var.region
  project_id  = var.project_id

  common_labels = merge(
    var.common_labels,
    {
      "environment" = var.environment
      "region"      = var.region
    }
  )

  service_name_suffix = random_string.suffix.result
}

# Outputs for dependent resources
