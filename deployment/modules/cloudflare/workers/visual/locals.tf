locals {
  resource_stage  = var.stage != "" ? "-${var.stage}" : ""
  resource_env    = "-${var.env}"
  resource_suffix = "${local.resource_env}${local.resource_stage}"

  is_production       = var.env == "prod" && var.stage == ""
  oauth_client_id     = local.is_production ? var.oauth_client_id : var.oauth_client_id_dev
  oauth_client_secret = local.is_production ? var.oauth_client_secret : var.oauth_client_secret_dev
}
