# Artifact Registry Repository for Docker images
resource "google_artifact_registry_repository" "owasp_demo" {
  location      = var.region
  repository_id = "owasp-demo"
  description   = "Docker repository for OWASP Demo application"
  format        = "DOCKER"

  depends_on = [google_project_service.artifact_registry]
}

# Output the repository URL
output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.owasp_demo.repository_id}"
  description = "Artifact Registry repository URL"
}

