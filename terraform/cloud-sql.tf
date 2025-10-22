# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "owasp_demo" {
  name             = "owasp-demo-db-${random_id.db_suffix.hex}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro" # Smallest tier for demo
    
    ip_configuration {
      ipv4_enabled = true
      
      # For demo purposes - allow public access
      # In production, use private IP and VPC connector
      authorized_networks {
        name  = "allow-all-demo"
        value = "0.0.0.0/0"
      }
    }

    backup_configuration {
      enabled = false # Disabled for demo to reduce costs
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = false # Allow deletion for demo

  depends_on = [google_project_service.cloud_sql]
}

# Random suffix for unique database instance name
resource "random_id" "db_suffix" {
  byte_length = 4
}

# Create database
resource "google_sql_database" "owasp_demo" {
  name     = var.db_name
  instance = google_sql_database_instance.owasp_demo.name
}

# Create database user
resource "google_sql_user" "owasp_demo" {
  name     = var.db_user
  instance = google_sql_database_instance.owasp_demo.name
  password = var.db_password
}

# Output database connection details
output "database_connection_name" {
  value       = google_sql_database_instance.owasp_demo.connection_name
  description = "Cloud SQL connection name"
}

output "database_public_ip" {
  value       = google_sql_database_instance.owasp_demo.public_ip_address
  description = "Database public IP address"
}

