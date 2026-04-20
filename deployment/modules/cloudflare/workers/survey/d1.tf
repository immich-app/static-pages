resource "cloudflare_d1_database" "survey" {
  account_id = var.cloudflare_account_id
  name       = "survey${local.resource_suffix}"

  read_replication = {
    mode = "disabled"
  }
}

resource "null_resource" "d1_migrations" {
  triggers = {
    migrations_hash = sha256(join("", [for f in fileset(var.migrations_dir, "*.sql") : filesha256("${var.migrations_dir}/${f}")]))
  }

  provisioner "local-exec" {
    # Apply each migration via the D1 REST endpoint. Fail the apply on real
    # errors — we treat "table already exists" / "duplicate column" errors
    # from re-running an already-applied migration as benign, but anything
    # else (auth failure, syntax error, rate-limit) must exit non-zero so
    # the failure is visible in the workflow instead of being masked.
    command = <<-EOT
      set -eo pipefail
      for f in $(ls ${var.migrations_dir}/*.sql | sort); do
        echo "Applying migration: $f"
        response=$(curl -sS -X POST \
          "https://api.cloudflare.com/client/v4/accounts/${var.cloudflare_account_id}/d1/database/${cloudflare_d1_database.survey.id}/query" \
          -H "Authorization: Bearer ${data.terraform_remote_state.api_keys_state.outputs.terraform_key_cloudflare_account}" \
          -H "Content-Type: application/json" \
          -d "{\"sql\": $(cat "$f" | jq -Rs .)}")

        success=$(echo "$response" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
          continue
        fi

        errors=$(echo "$response" | jq -r '.errors // [] | map(.message) | join("; ")')
        if echo "$errors" | grep -qiE "already exists|duplicate column"; then
          echo "  (already applied): $errors"
          continue
        fi

        echo "Migration $f failed:" >&2
        echo "$response" | jq . >&2
        exit 1
      done
    EOT
  }

  depends_on = [cloudflare_d1_database.survey]
}
