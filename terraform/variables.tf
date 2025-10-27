variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "jwt_secret" {
  description = "JWT Secret for authentication"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Session Secret"
  type        = string
  sensitive   = true
}

variable "enable_vulnerable_endpoints" {
  description = "Enable vulnerable endpoints (set to false for production!)"
  type        = bool
  default     = false
}

variable "backend_image" {
  description = "Backend Docker image URL"
  type        = string
}

variable "frontend_image" {
  description = "Frontend Docker image URL"
  type        = string
}

variable "attacker_image" {
  description = "Attacker Docker image URL"
  type        = string
}

