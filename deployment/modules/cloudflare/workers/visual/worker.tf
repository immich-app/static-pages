resource "cloudflare_worker" "api" {
  account_id = var.cloudflare_account_id
  name       = "visual-api${local.resource_suffix}"

  observability = {
    enabled = true
  }
}

resource "cloudflare_worker_version" "api" {
  account_id         = var.cloudflare_account_id
  worker_id          = cloudflare_worker.api.id
  compatibility_date = "2026-10-01"

  main_module = "index.js"

  modules = [{
    name         = "index.js"
    content_file = "${var.dist_dir}/index.js"
    content_type = "application/javascript+module"
  }]

  bindings = [
    {
      name = "DB"
      type = "d1"
      id   = cloudflare_d1_database.visual.id
    },
    {
      name = "OAUTH_ISSUER"
      type = "plain_text"
      text = var.oauth_issuer
    },
    {
      name = "OAUTH_CLIENT_ID"
      type = "plain_text"
      text = local.oauth_client_id
    },
    {
      name = "OAUTH_CLIENT_SECRET"
      type = "secret_text"
      text = local.oauth_client_secret
    },
  ]

  depends_on = [terraform_data.migrations]
}

resource "cloudflare_workers_deployment" "api" {
  account_id  = var.cloudflare_account_id
  script_name = cloudflare_worker.api.name
  strategy    = "percentage"

  versions = [{
    version_id = cloudflare_worker_version.api.id
    percentage = 100
  }]
}

data "cloudflare_zone" "immich_app" {
  filter = {
    account_id = var.cloudflare_account_id
    name       = "immich.app"
  }
}

resource "cloudflare_workers_route" "api_root" {
  zone_id = data.cloudflare_zone.immich_app.zone_id
  pattern = "${module.domain.fqdn}/api"
  script  = cloudflare_worker.api.name

  depends_on = [cloudflare_workers_deployment.api]
}

resource "cloudflare_workers_route" "api_wildcard" {
  zone_id = data.cloudflare_zone.immich_app.zone_id
  pattern = "${module.domain.fqdn}/api/*"
  script  = cloudflare_worker.api.name

  depends_on = [cloudflare_workers_deployment.api]
}

module "domain" {
  source = "git::https://github.com/immich-app/devtools.git//tf/shared/modules/domain?ref=main"

  app_name = var.app_name
  stage    = var.stage
  env      = var.env
}
