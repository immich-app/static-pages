resource "cloudflare_workers_script" "api" {
  account_id         = var.cloudflare_account_id
  name               = "survey-api${local.resource_suffix}"
  content            = file("${var.dist_dir}/index.js")
  compatibility_date = "2025-06-03"
  module             = true

  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.survey.id
  }

  analytics_engine_binding {
    name    = "ANALYTICS"
    dataset = "survey_heartbeats"
  }

  # Auto-generated secrets (random per environment)
  secret_text_binding {
    name = "SESSION_SECRET"
    text = random_password.session_secret.result
  }

  secret_text_binding {
    name = "PASSWORD_SECRET"
    text = random_password.password_secret.result
  }

  # OIDC configuration (optional — set via variables)
  dynamic "secret_text_binding" {
    for_each = var.oidc_client_secret != "" ? [1] : []
    content {
      name = "OIDC_CLIENT_SECRET"
      text = var.oidc_client_secret
    }
  }

  dynamic "plain_text_binding" {
    for_each = var.oidc_issuer != "" ? [1] : []
    content {
      name = "OIDC_ISSUER"
      text = var.oidc_issuer
    }
  }

  dynamic "plain_text_binding" {
    for_each = var.oidc_client_id != "" ? [1] : []
    content {
      name = "OIDC_CLIENT_ID"
      text = var.oidc_client_id
    }
  }

  dynamic "plain_text_binding" {
    for_each = var.oidc_redirect_uri != "" ? [1] : []
    content {
      name = "OIDC_REDIRECT_URI"
      text = var.oidc_redirect_uri
    }
  }

  plain_text_binding {
    name = "OIDC_ROLE_CLAIM"
    text = var.oidc_role_claim
  }

  plain_text_binding {
    name = "OIDC_ROLE_MAP_ADMIN"
    text = var.oidc_role_map_admin
  }

  plain_text_binding {
    name = "OIDC_ROLE_MAP_EDITOR"
    text = var.oidc_role_map_editor
  }

  plain_text_binding {
    name = "CF_ACCOUNT_ID"
    text = var.cloudflare_account_id
  }

  secret_text_binding {
    name = "CF_ANALYTICS_API_TOKEN"
    text = cloudflare_api_token.analytics_read.value
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
