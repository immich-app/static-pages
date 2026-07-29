variable "tf_state_postgres_conn_str" {}
variable "stage" {}
variable "env" {}
variable "app_name" {}
variable "cloudflare_account_id" {}
variable "dist_dir" {}
variable "migrations_dir" {}

# OIDC configuration (optional — leave empty to disable OIDC)
variable "oidc_issuer" {
  description = "OIDC provider issuer URL (e.g., https://auth.example.com/realms/immich)"
  type        = string
  default     = ""
}

variable "oidc_client_id" {
  description = "OIDC client ID"
  type        = string
  default     = ""
}

variable "oidc_client_secret" {
  description = "OIDC client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "oidc_client_id_dev" {
  description = "OIDC client ID of the dev_mode application used by non-production stages"
  type        = string
  default     = ""
}

variable "oidc_client_secret_dev" {
  description = "OIDC client secret of the dev_mode application used by non-production stages"
  type        = string
  sensitive   = true
  default     = ""
}

variable "oidc_role_claim" {
  description = "Claim containing the user's role. Zitadel flattens project roles into a top-level `role` claim (a single string); it never emits `groups`."
  type        = string
  default     = "role"
}

variable "oidc_role_map_admin" {
  description = "Claim value that maps to admin role"
  type        = string
  default     = "survey-admin"
}

variable "oidc_role_map_editor" {
  description = "Claim value that maps to editor role"
  type        = string
  default     = "survey-editor"
}

# Temporary: needed to destroy orphaned analytics token resource
variable "cloudflare_api_token" {
  description = "Cloudflare API token (temporary, remove after analytics token is destroyed from state)"
  type        = string
  sensitive   = true
}

