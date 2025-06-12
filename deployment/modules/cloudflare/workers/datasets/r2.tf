resource "cloudflare_r2_bucket" "uploads" {
  account_id = var.cloudflare_account_id
  name       = "datasets-uploads${local.resource_suffix}"
  location   = "WEUR"
}
