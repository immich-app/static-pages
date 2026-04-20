provider "cloudflare" {
  api_token = data.terraform_remote_state.api_keys_state.outputs.terraform_key_cloudflare_account
}

# Temporary: needed to destroy orphaned analytics token resource from state
provider "cloudflare" {
  alias     = "token_creator"
  api_token = var.cloudflare_api_token
}
