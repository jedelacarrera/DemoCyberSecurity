# Cloud Run Service - Backend
resource "google_cloud_run_service" "backend" {
  name     = "owasp-demo-backend"
  location = var.region

  template {
    spec {
      containers {
        image = var.backend_image

        ports {
          container_port = 3001
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "PORT"
          value = "3001"
        }

        env {
          name  = "DB_HOST"
          value = google_sql_database_instance.owasp_demo.public_ip_address
        }

        env {
          name  = "DB_PORT"
          value = "5432"
        }

        env {
          name  = "DB_NAME"
          value = var.db_name
        }

        env {
          name  = "DB_USER"
          value = var.db_user
        }

        env {
          name = "DB_PASSWORD"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret_version.db_password.secret
              key  = "latest"
            }
          }
        }

        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret_version.jwt_secret.secret
              key  = "latest"
            }
          }
        }

        env {
          name = "SESSION_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret_version.session_secret.secret
              key  = "latest"
            }
          }
        }

        env {
          name  = "ENABLE_VULNERABLE_ENDPOINTS"
          value = tostring(var.enable_vulnerable_endpoints)
        }

        env {
          name  = "CORS_ORIGIN"
          value = "https://${google_cloud_run_service.frontend.status[0].url}"
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "0"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.cloud_run,
    google_sql_database_instance.owasp_demo
  ]
}

# IAM policy to make backend publicly accessible
resource "google_cloud_run_service_iam_member" "backend_public" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run Service - Frontend
resource "google_cloud_run_service" "frontend" {
  name     = "owasp-demo-frontend"
  location = var.region

  template {
    spec {
      containers {
        image = var.frontend_image

        ports {
          container_port = 3000
        }

        env {
          name  = "NEXT_PUBLIC_API_URL"
          value = google_cloud_run_service.backend.status[0].url
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "0"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.cloud_run,
    google_cloud_run_service.backend
  ]
}

# IAM policy to make frontend publicly accessible
resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run Service - Attacker (optional)
resource "google_cloud_run_service" "attacker" {
  name     = "owasp-demo-attacker"
  location = var.region

  template {
    spec {
      containers {
        image = var.attacker_image

        ports {
          container_port = 80
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "256Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "5"
        "autoscaling.knative.dev/minScale" = "0"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.cloud_run]
}

# IAM policy to make attacker publicly accessible
resource "google_cloud_run_service_iam_member" "attacker_public" {
  service  = google_cloud_run_service.attacker.name
  location = google_cloud_run_service.attacker.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

