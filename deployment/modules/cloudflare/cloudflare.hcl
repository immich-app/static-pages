locals {
  env = get_env("TF_VAR_env")
  app_name = replace(get_env("TF_VAR_app_name"), "-", "_")
}

