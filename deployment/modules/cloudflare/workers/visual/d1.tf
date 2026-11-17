resource "cloudflare_d1_database" "visual" {
  account_id = var.cloudflare_account_id
  name       = "visual${local.resource_suffix}"

  read_replication = {
    mode = "disabled"
  }
}

resource "terraform_data" "migrations" {
  triggers_replace = {
    database_id = cloudflare_d1_database.visual.id
    migrations  = sha256(join("", [for file in sort(fileset(var.migrations_dir, "*.sql")) : filesha256("${var.migrations_dir}/${file}")]))
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]

    environment = {
      CI                    = "true"
      CLOUDFLARE_ACCOUNT_ID = var.cloudflare_account_id
      CLOUDFLARE_API_TOKEN  = data.terraform_remote_state.api_keys_state.outputs.terraform_key_cloudflare_account
      DATABASE_ID           = cloudflare_d1_database.visual.id
      DATABASE_NAME         = cloudflare_d1_database.visual.name
      MIGRATIONS_DIR        = var.migrations_dir
    }

    command = <<-EOT
      set -euo pipefail
      config="$(mktemp -d)/wrangler.json"
      jq -n '{name: "visual-migrations", d1_databases: [{binding: "DB", database_name: env.DATABASE_NAME, database_id: env.DATABASE_ID, migrations_dir: env.MIGRATIONS_DIR}]}' > "$config"
      wrangler d1 migrations apply "$DATABASE_NAME" --remote --config "$config"
    EOT
  }
}
