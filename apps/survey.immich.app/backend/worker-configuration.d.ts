interface Env {
  DB: D1Database;
  ANALYTICS: AnalyticsEngineDataset;
  CF_ACCOUNT_ID?: string;
  CF_ANALYTICS_API_TOKEN?: string;
  PASSWORD_SECRET: string;
  OIDC_ISSUER: string;
  OIDC_CLIENT_ID: string;
  OIDC_CLIENT_SECRET: string;
  OIDC_REDIRECT_URI: string;
  OIDC_ROLE_CLAIM: string;
  OIDC_ROLE_MAP_ADMIN: string;
  OIDC_ROLE_MAP_EDITOR: string;
  SESSION_SECRET: string;
  DISABLE_PASSWORD_AUTH?: string;
}
