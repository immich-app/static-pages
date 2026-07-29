resource "random_password" "session_secret" {
  length  = 64
  special = false
}

resource "random_password" "password_secret" {
  length  = 64
  special = false
}

resource "random_password" "admin_setup_token" {
  length  = 48
  special = false
}

output "admin_setup_token" {
  description = "Token required in the X-Setup-Token header when claiming the admin account."
  value       = random_password.admin_setup_token.result
  sensitive   = true
}
