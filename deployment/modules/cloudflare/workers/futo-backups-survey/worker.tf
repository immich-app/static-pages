resource "cloudflare_workers_script" "api" {
  account_id         = var.cloudflare_account_id
  name               = "futo-backups-survey-api${local.resource_suffix}"
  content            = file("${var.dist_dir}/index.js")
  compatibility_date = "2025-06-03"
  module             = true

  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.survey.id
  }
}

data "cloudflare_zone" "immich_app" {
  name = "immich.app"
}

resource "cloudflare_workers_route" "survey_api_root" {
  pattern     = "${module.domain.fqdn}/api"
  script_name = cloudflare_workers_script.api.name
  zone_id     = data.cloudflare_zone.immich_app.zone_id
}

resource "cloudflare_workers_route" "survey_api_wildcard" {
  pattern     = "${module.domain.fqdn}/api/*"
  script_name = cloudflare_workers_script.api.name
  zone_id     = data.cloudflare_zone.immich_app.zone_id
}

module "domain" {
  source = "git::https://github.com/immich-app/devtools.git//tf/shared/modules/domain?ref=main"

  app_name = var.app_name
  stage    = var.stage
  env      = var.env
}
