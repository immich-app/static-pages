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
  setupToken: string;
}

export interface AppContext {
  db: Kysely<Database>;
  config: AppConfig;
}

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
    setupToken: env.ADMIN_SETUP_TOKEN ?? '',
    cookieSecure: true, // Always true on Workers (HTTPS)
  };
}

export function configFromProcessEnv(): AppConfig {
  const passwordSecret = process.env.PASSWORD_SECRET ?? '';
  const sessionSecret = process.env.SESSION_SECRET ?? '';
  // Fail fast: an empty signing key doesn't error, it silently breaks all auth.
  if (!passwordSecret || !sessionSecret) {
    throw new Error('PASSWORD_SECRET and SESSION_SECRET must both be set to non-empty values.');
  }
  return {
    passwordSecret,
    sessionSecret,
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
    setupToken: process.env.ADMIN_SETUP_TOKEN ?? '',
    cookieSecure: process.env.COOKIE_SECURE !== 'false',
  };
}

export function getContext(request: IRequest): AppContext {
  return (request as any).ctx as AppContext;
}
