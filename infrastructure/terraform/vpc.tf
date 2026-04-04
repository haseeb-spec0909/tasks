# VPC Network
resource "google_compute_network" "timeintel_vpc" {
  name                    = "timeintel-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"

  labels = local.common_labels
}

# Subnetwork for asia-south1
resource "google_compute_subnetwork" "timeintel_subnet" {
  name          = "timeintel-subnet-${var.region}"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.timeintel_vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.4.0.0/14"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.8.0.0/20"
  }

  labels = local.common_labels
}

# VPC Access Connector for Cloud Run to access Cloud SQL and Redis
resource "google_vpc_access_connector" "timeintel_connector" {
  name          = "timeintel-connector"
  ip_cidr_range = "10.12.0.0/28"
  network       = google_compute_network.timeintel_vpc.name
  region        = var.region

  machine_type = "e2-micro"

  labels = local.common_labels
}

# Private connection for Cloud SQL
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.timeintel_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_block.name]
}

resource "google_compute_global_address" "private_ip_block" {
  name          = "private-ip-block"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.timeintel_vpc.id
}

# Firewall rule - allow internal traffic
resource "google_compute_firewall" "allow_internal" {
  name    = "timeintel-allow-internal"
  network = google_compute_network.timeintel_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/8"]
}

# Firewall rule - allow health checks
resource "google_compute_firewall" "allow_health_checks" {
  name    = "timeintel-allow-health-checks"
  network = google_compute_network.timeintel_vpc.name

  allow {
    protocol = "tcp"
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
}

# Firewall rule - allow SSH from internal networks only
# TODO: Replace 10.0.0.0/8 with specific office IP addresses (e.g., ["203.0.113.0/24"])
resource "google_compute_firewall" "allow_ssh" {
  name    = "timeintel-allow-ssh"
  network = google_compute_network.timeintel_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["10.0.0.0/8"]

  target_tags = ["ssh-enabled"]
}

# Outputs
output "vpc_network_id" {
  value       = google_compute_network.timeintel_vpc.id
  description = "VPC network ID"
}

output "vpc_network_name" {
  value       = google_compute_network.timeintel_vpc.name
  description = "VPC network name"
}

output "subnetwork_id" {
  value       = google_compute_subnetwork.timeintel_subnet.id
  description = "Subnetwork ID"
}

output "vpc_connector_name" {
  value       = google_vpc_access_connector.timeintel_connector.name
  description = "VPC Access Connector name for Cloud Run"
}
