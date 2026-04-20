import type { Kysely } from 'kysely';
import type { IRequest } from 'itty-router';
import type { Database } from './db';

export interface AppConfig {
  passwordSecret: string;
  sessionSecret: string;
  oidc: {
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    roleClaim: string;
    roleMapAdmin: string;
    roleMapEditor: string;
  };
  disablePasswordAuth: boolean;
  cookieSecure: boolean;
}

export interface AppContext {
  db: Kysely<Database>;
  config: AppConfig;
}

// Load config from Cloudflare Workers Env
export function configFromEnv(env: Env): AppConfig {
  return {
    passwordSecret: env.PASSWORD_SECRET ?? '',
    sessionSecret: env.SESSION_SECRET ?? '',
    oidc: {
      issuer: env.OIDC_ISSUER ?? '',
      clientId: env.OIDC_CLIENT_ID ?? '',
      clientSecret: env.OIDC_CLIENT_SECRET ?? '',
      redirectUri: env.OIDC_REDIRECT_URI ?? '',
      roleClaim: env.OIDC_ROLE_CLAIM ?? 'groups',
      roleMapAdmin: env.OIDC_ROLE_MAP_ADMIN ?? 'survey-admin',
      roleMapEditor: env.OIDC_ROLE_MAP_EDITOR ?? 'survey-editor',
    },
    disablePasswordAuth: env.DISABLE_PASSWORD_AUTH === 'true',
    cookieSecure: true, // Always true on Workers (HTTPS)
  };
}

// Load config from Node.js process.env
export function configFromProcessEnv(): AppConfig {
  return {
    passwordSecret: process.env.PASSWORD_SECRET ?? '',
    sessionSecret: process.env.SESSION_SECRET ?? '',
    oidc: {
      issuer: process.env.OIDC_ISSUER ?? '',
      clientId: process.env.OIDC_CLIENT_ID ?? '',
      clientSecret: process.env.OIDC_CLIENT_SECRET ?? '',
      redirectUri: process.env.OIDC_REDIRECT_URI ?? '',
      roleClaim: process.env.OIDC_ROLE_CLAIM ?? 'groups',
      roleMapAdmin: process.env.OIDC_ROLE_MAP_ADMIN ?? 'survey-admin',
      roleMapEditor: process.env.OIDC_ROLE_MAP_EDITOR ?? 'survey-editor',
    },
    disablePasswordAuth: process.env.DISABLE_PASSWORD_AUTH === 'true',
    cookieSecure: process.env.COOKIE_SECURE !== 'false',
  };
}

export function getContext(request: IRequest): AppContext {
  return (request as any).ctx as AppContext;
}
