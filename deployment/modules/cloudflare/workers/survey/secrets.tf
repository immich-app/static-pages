resource "random_password" "session_secret" {
  length  = 64
  special = false
}

resource "random_password" "password_secret" {
  length  = 64
  special = false
}
