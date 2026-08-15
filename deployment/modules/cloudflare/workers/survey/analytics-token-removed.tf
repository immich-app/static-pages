# Temporary: destroy orphaned analytics resources from state.
# Remove this file, the token_creator provider, and cloudflare_api_token variable
# after the first successful apply.

removed {
  from = cloudflare_api_token.analytics_read
  lifecycle {
    destroy = true
  }
}
