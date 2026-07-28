resource "random_password" "session_secret" {
  length  = 64
  special = false
}

resource "random_password" "password_secret" {
  length  = 64
  special = false
}

# Gates the first-run admin claim (POST /api/auth/setup).
#
# Every deploy — production and each per-PR stage — provisions an empty D1
# database, so `admin_credentials` starts unclaimed and the app advertises
# `needsSetup: true` to anonymous callers. These workers are routed on a public
# immich.app hostname with no fronting auth, so without this token the first
# stranger to POST /api/auth/setup becomes admin of the instance.
#
# The backend only enforces this when ADMIN_SETUP_TOKEN is bound and non-empty,
# which keeps self-hosted/Docker deployments (where the operator controls
# network exposure) working exactly as before.
#
# Retrieve it to claim an instance with:
#   terragrunt output -raw admin_setup_token
resource "random_password" "admin_setup_token" {
  length  = 48
  special = false
}

output "admin_setup_token" {
  description = "Token required in the X-Setup-Token header when claiming the admin account."
  value       = random_password.admin_setup_token.result
  sensitive   = true
}
