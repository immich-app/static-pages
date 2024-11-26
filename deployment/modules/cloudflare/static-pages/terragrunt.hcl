terraform {
  source = "."

  extra_arguments custom_vars {
    commands = get_terraform_commands_that_need_vars()
  }
}

include {
  path = find_in_parent_folders("state.hcl")
}

locals {
  env = get_env("TF_VAR_env")
  stage = get_env("TF_VAR_stage")
  app_name = replace(get_env("TF_VAR_app_name"), "-", "_")
}

remote_state {
  backend = "pg"

  config = {
    conn_str = get_env("TF_VAR_tf_state_postgres_conn_str")
    schema_name = "cloudflare_immich_app_${local.app_name}_${local.env}${local.stage}"
  }
}
