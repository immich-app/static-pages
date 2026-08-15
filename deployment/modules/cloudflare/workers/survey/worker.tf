locals {
  is_production = var.env == "prod" && var.stage == ""

  # Production and preview authenticate against different Zitadel applications.
  # Preview hostnames are per-PR and unbounded, so they can only be registered
  # as a glob, which Zitadel permits only on a dev_mode application — and
  # dev_mode also drops the https requirement, so it must not be enabled on the
  # application production uses.
  oidc_client_id     = local.is_production ? var.oidc_client_id : var.oidc_client_id_dev
  oidc_client_secret = local.is_production ? var.oidc_client_secret : var.oidc_client_secret_dev

  # All-or-nothing: a half-populated config yields a worker that advertises
  # oidcEnabled and then builds an authorize URL with an empty redirect_uri.
  oidc_enabled = var.oidc_issuer != "" && local.oidc_client_id != "" && local.oidc_client_secret != ""

  # Derived so it always matches the hostname this stage actually serves.
  oidc_redirect_uri = "https://${module.domain.fqdn}/api/auth/callback"

  oidc_bindings = concat(
    local.oidc_enabled ? [
      {
        name = "OIDC_ISSUER"
        type = "plain_text"
        text = var.oidc_issuer
      },
      {
        name = "OIDC_CLIENT_ID"
        type = "plain_text"
        text = local.oidc_client_id
      },
      {
        name = "OIDC_CLIENT_SECRET"
        type = "secret_text"
        text = local.oidc_client_secret
      },
      {
        name = "OIDC_REDIRECT_URI"
        type = "plain_text"
        text = local.oidc_redirect_uri
      },
    ] : [],
    # Only production goes SSO-only. Previews keep password auth alongside OIDC
    # so a misconfigured claim leaves the stage debuggable instead of shut.
    local.oidc_enabled && local.is_production ? [
      {
        name = "DISABLE_PASSWORD_AUTH"
        type = "plain_text"
        text = "true"
      },
    ] : [],
  )

  api_bindings = concat(
    [
      {
        name = "DB"
        type = "d1"
        id   = cloudflare_d1_database.survey.id
      },
      {
        name        = "SURVEY_SESSIONS"
        type        = "durable_object_namespace"
        class_name  = "SurveyDO"
        script_name = cloudflare_worker.sessions.name
      },
      {
        name = "SESSION_SECRET"
        type = "secret_text"
        text = random_password.session_secret.result
      },
      {
        name = "PASSWORD_SECRET"
        type = "secret_text"
        text = random_password.password_secret.result
      },
      {
        name = "ADMIN_SETUP_TOKEN"
        type = "secret_text"
        text = random_password.admin_setup_token.result
      },
      {
        name = "OIDC_ROLE_CLAIM"
        type = "plain_text"
        text = var.oidc_role_claim
      },
      {
        name = "OIDC_ROLE_MAP_ADMIN"
        type = "plain_text"
        text = var.oidc_role_map_admin
      },
      {
        name = "OIDC_ROLE_MAP_EDITOR"
        type = "plain_text"
        text = var.oidc_role_map_editor
      },
    ],
    local.oidc_bindings,
  )
}

# --- Durable Object worker (deploys first) ---

resource "cloudflare_worker" "sessions" {
  account_id = var.cloudflare_account_id
  name       = "survey-sessions${local.resource_suffix}"

  observability = {
    enabled = true
  }
}

resource "cloudflare_worker_version" "sessions" {
  account_id         = var.cloudflare_account_id
  worker_id          = cloudflare_worker.sessions.id
  compatibility_date = "2025-06-03"

  main_module = "sessions.js"

  modules = [{
    name         = "sessions.js"
    content_file = "${var.dist_dir}/sessions.js"
    content_type = "application/javascript+module"
  }]

  migrations = {
    old_tag = "v2"
    new_tag = "v2"
  }
}

resource "cloudflare_workers_deployment" "sessions" {
  account_id  = var.cloudflare_account_id
  script_name = cloudflare_worker.sessions.name
  strategy    = "percentage"

  versions = [{
    version_id = cloudflare_worker_version.sessions.id
    percentage = 100
  }]
}

resource "cloudflare_worker" "api" {
  account_id = var.cloudflare_account_id
  name       = "survey-api${local.resource_suffix}"

  observability = {
    enabled = true
  }
}

resource "cloudflare_worker_version" "api" {
  account_id         = var.cloudflare_account_id
  worker_id          = cloudflare_worker.api.id
  compatibility_date = "2025-06-03"

  main_module = "index.js"

  modules = [{
    name         = "index.js"
    content_file = "${var.dist_dir}/index.js"
    content_type = "application/javascript+module"
  }]

  bindings = local.api_bindings

  depends_on = [cloudflare_workers_deployment.sessions]
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

resource "cloudflare_workers_route" "survey_api_root" {
  zone_id = data.cloudflare_zone.immich_app.zone_id
  pattern = "${module.domain.fqdn}/api"
  script  = cloudflare_worker.api.name
}

resource "cloudflare_workers_route" "survey_api_wildcard" {
  zone_id = data.cloudflare_zone.immich_app.zone_id
  pattern = "${module.domain.fqdn}/api/*"
  script  = cloudflare_worker.api.name
}

module "domain" {
  source = "git::https://github.com/immich-app/devtools.git//tf/shared/modules/domain?ref=main"

  app_name = var.app_name
  stage    = var.stage
  env      = var.env
}
