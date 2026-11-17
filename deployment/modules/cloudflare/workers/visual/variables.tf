variable "tf_state_postgres_conn_str" {}
variable "stage" {}
variable "env" {}
variable "app_name" {}
variable "cloudflare_account_id" {}
variable "dist_dir" {}
variable "migrations_dir" {}

variable "oauth_issuer" {
  type = string
}

variable "oauth_client_id" {
  type = string
}

variable "oauth_client_secret" {
  type      = string
  sensitive = true
}

variable "oauth_client_id_dev" {
  type = string
}

variable "oauth_client_secret_dev" {
  type      = string
  sensitive = true
}
