output "frontend_url" {
  value       = google_cloud_run_service.frontend.status[0].url
  description = "Frontend application URL"
}

output "backend_url" {
  value       = google_cloud_run_service.backend.status[0].url
  description = "Backend API URL"
}

output "attacker_url" {
  value       = google_cloud_run_service.attacker.status[0].url
  description = "Attacker site URL"
}

output "database_info" {
  value = {
    connection_name = google_sql_database_instance.owasp_demo.connection_name
    public_ip       = google_sql_database_instance.owasp_demo.public_ip_address
    database_name   = google_sql_database.owasp_demo.name
  }
  description = "Database connection information"
  sensitive   = true
}

output "service_account_email" {
  value       = google_service_account.cloud_run.email
  description = "Service account email for Cloud Run"
}

