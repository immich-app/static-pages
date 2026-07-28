locals {
  # OIDC is enabled only when it can actually work end to end:
  #
  #  - Credentials must be present. These bindings used to be gated
  #    independently, so a half-populated config produced a worker that
  #    advertised `oidcEnabled: true` and then built an authorize URL with an
  #    empty redirect_uri — a login button that always fails. All-or-nothing
  #    instead.
  #  - Production only. Zitadel matches redirect URIs exactly and has no
  #    wildcards, but every PR stage gets its own hostname
  #    (survey.pr-<n>.dev.immich.app), which cannot be pre-registered. Preview
  #    stages therefore keep password auth (plus the setup token) as before.
  oidc_configured = var.oidc_issuer != "" && var.oidc_client_id != "" && var.oidc_client_secret != ""
  oidc_enabled    = local.oidc_configured && var.env == "prod" && var.stage == ""

  # Derived rather than supplied: the callback must live on whichever hostname
  # this stage actually serves, and the app calls /api/auth/login same-origin.
  oidc_redirect_uri = "https://${module.domain.fqdn}/api/auth/callback"

  oidc_bindings = local.oidc_enabled ? [
    {
      name = "OIDC_ISSUER"
      type = "plain_text"
      text = var.oidc_issuer
    },
    {
      name = "OIDC_CLIENT_ID"
      type = "plain_text"
      text = var.oidc_client_id
    },
    {
      name = "OIDC_CLIENT_SECRET"
      type = "secret_text"
      text = var.oidc_client_secret
    },
    {
      name = "OIDC_REDIRECT_URI"
      type = "plain_text"
      text = local.oidc_redirect_uri
    },
    # Only disable password auth where OIDC actually works, or a stage would be
    # left with no way to sign in at all.
    {
      name = "DISABLE_PASSWORD_AUTH"
      type = "plain_text"
      text = "true"
    },
  ] : []

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

  # SurveyDO is provisioned as a SQLite-backed class through the wrangler
  # migration chain (wrangler-do.jsonc: v1 new_classes SurveySession -> v2
  # new_sqlite_classes SurveyDO), which leaves these workers at tag "v2". This
  # is therefore a no-op migration that just asserts the current tag; the
  # precondition old_tag == new_tag == "v2" matches the deployed worker.
  # (Do NOT set new_tag = "v1" / new_sqlite_classes here: the worker already
  # exists at v2, so Cloudflare rejects it with a 412 migration-tag precondition
  # error.)
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

# --- Main API worker ---

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

  # API worker depends on the sessions deployment being live
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

# --- Routes ---

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
