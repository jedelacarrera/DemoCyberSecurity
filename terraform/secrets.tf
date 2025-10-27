# Enable Secret Manager API
resource "google_project_service" "secret_manager" {
  service = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# Secret for JWT Secret
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "owasp-demo-jwt-secret"

  replication {
    automatic = true
  }

  depends_on = [google_project_service.secret_manager]
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

# Secret for Session Secret
resource "google_secret_manager_secret" "session_secret" {
  secret_id = "owasp-demo-session-secret"

  replication {
    automatic = true
  }

  depends_on = [google_project_service.secret_manager]
}

resource "google_secret_manager_secret_version" "session_secret" {
  secret      = google_secret_manager_secret.session_secret.id
  secret_data = var.session_secret
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "owasp-demo-cloud-run"
  display_name = "Cloud Run Service Account for OWASP Demo"
}

# Grant Cloud Run service account access to secrets
resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  secret_id = google_secret_manager_secret.jwt_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "session_secret_access" {
  secret_id = google_secret_manager_secret.session_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

