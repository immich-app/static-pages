data "cloudflare_api_token_permission_groups" "all" {
  provider = cloudflare.token_creator
}

resource "cloudflare_api_token" "analytics_read" {
  provider = cloudflare.token_creator
  name     = "survey-analytics-read${local.resource_suffix}"
  policy {
    permission_groups = [
      data.cloudflare_api_token_permission_groups.all.account["Account Analytics Read"],
    ]
    resources = {
      "com.cloudflare.api.account.*" = "*"
    }
  }
}
