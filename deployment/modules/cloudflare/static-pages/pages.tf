locals {
  account_id = data.terraform_remote_state.cloudflare_account.outputs.cloudflare_account_id
  ui_prod = var.app_name == "ui" && var.env == "prod"
}

module "static_pages" {
  source = "git::https://github.com/immich-app/devtools.git//tf/shared/modules/cloudflare-pages?ref=main"

  cloudflare_api_token          = data.terraform_remote_state.api_keys_state.outputs.terraform_key_cloudflare_docs
  cloudflare_account_id         = local.account_id

  pages_project = data.terraform_remote_state.cloudflare_pages_project.outputs.pages_project

  app_name = var.app_name
  stage    = var.stage
  env      = var.env
}

data "cloudflare_zone" "immich_app" {
  name = "immich.app"
}

data "cloudflare_record" "ui_cname" {
  count    = var.app_name == "ui" && var.env == "prod" && var.stage == "" ? 1 : 0
  zone_id  = data.cloudflare_zone.immich_app.id
  hostname = "ui.immich.app"
  type     = "CNAME"
}

import {
  for_each = local.ui_prod ? toset(["this"]) : toset([])
  id       = "${local.account_id}/ui-immich-app-prod/ui.immich.app"
  to       = module.static_pages.cloudflare_pages_domain.pages_domain
}

import {
  for_each = local.ui_prod ? toset(["this"]) : toset([])
  id       = "${data.cloudflare_zone.immich_app.id}/${data.cloudflare_record.ui_cname[0].id}"
  to       = module.static_pages.cloudflare_record.pages_subdomain
}

output "pages_branch" {
  value = module.static_pages.pages_branch
}

output "immich_subdomain" {
  value = module.static_pages.branch_subdomain
}

output "pages_branch_subdomain" {
  value = module.static_pages.pages_branch_subdomain
}

output "pages_project_name" {
  value = module.static_pages.pages_project_name
}
