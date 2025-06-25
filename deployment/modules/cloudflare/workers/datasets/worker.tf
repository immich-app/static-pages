resource "cloudflare_workers_script" "api" {
  account_id = var.cloudflare_account_id
  name       = "datasets-api${local.resource_suffix}"
  content    = file("${var.dist_dir}/index.js")
  module     = true

  secret_text_binding {
    name = "CF_TURNSTILE_SECRET"
    text = data.terraform_remote_state.cloudflare_account.outputs.turnstile_default_invisible_secret
  }

  secret_text_binding {
    name = "JWT_SECRET"
    text = random_password.jwt_secret.result
  }

  r2_bucket_binding {
    name        = "IMAGE_UPLOADS"
    bucket_name = cloudflare_r2_bucket.uploads.name
  }
}

data "cloudflare_zone" "immich_app" {
  name = "immich.app"
}

resource "cloudflare_workers_route" "dataset_api_root" {
  pattern     = "${module.domain.fqdn}/api"
  script_name = cloudflare_workers_script.api.name
  zone_id     = data.cloudflare_zone.immich_app.zone_id
}

resource "cloudflare_workers_route" "dataset_api_wildcard" {
  pattern     = "${module.domain.fqdn}/api/*"
  script_name = cloudflare_workers_script.api.name
  zone_id     = data.cloudflare_zone.immich_app.zone_id
}

resource "random_password" "jwt_secret" {
  length           = 32
  special          = true
}

module "domain" {
  source = "git::https://github.com/immich-app/devtools.git//tf/shared/modules/domain?ref=main"

  app_name = var.app_name
  stage    = var.stage
  env      = var.env
}
