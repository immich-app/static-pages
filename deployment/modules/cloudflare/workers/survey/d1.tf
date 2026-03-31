resource "cloudflare_d1_database" "survey" {
  account_id = var.cloudflare_account_id
  name       = "survey${local.resource_suffix}"
}

resource "null_resource" "d1_migrations" {
  triggers = {
    migrations_hash = sha256(join("", [for f in fileset(var.migrations_dir, "*.sql") : filesha256("${var.migrations_dir}/${f}")]))
  }

  provisioner "local-exec" {
    command = <<-EOT
      for f in $(ls ${var.migrations_dir}/*.sql | sort); do
        echo "Applying migration: $f"
        curl -sf -X POST \
          "https://api.cloudflare.com/client/v4/accounts/${var.cloudflare_account_id}/d1/database/${cloudflare_d1_database.survey.id}/query" \
          -H "Authorization: Bearer ${data.terraform_remote_state.api_keys_state.outputs.terraform_key_cloudflare_account}" \
          -H "Content-Type: application/json" \
          -d "{\"sql\": $(cat "$f" | jq -Rs .)}" || echo "Migration $f may already be applied"
      done
    EOT
  }

  depends_on = [cloudflare_d1_database.survey]
}
