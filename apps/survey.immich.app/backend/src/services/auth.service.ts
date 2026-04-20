import type { Kysely } from 'kysely';
import type { Database } from '../db';
import type { AppConfig } from '../config';
import { ServiceError } from './errors';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { verifySessionToken } from '../utils/session';

export interface UserInfo {
  sub: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface OidcConfig {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  issuer: string;
}

let cachedOidcConfig: { data: OidcConfig; fetchedAt: number } | null = null;
let cachedJwks: { data: { keys: Array<JsonWebKey & { kid?: string; alg?: string }> }; fetchedAt: number } | null = null;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export class AuthService {
  constructor(
    private config: AppConfig,
    private db: Kysely<Database>,
  ) {}

  // --- Password-based auth (default) ---

  async isSetupComplete(): Promise<boolean> {
    const row = await this.db
      .selectFrom('admin_credentials')
      .select('id')
      .where('id', '=', 'default')
      .executeTakeFirst();
    return !!row;
  }

  async setupAdmin(password: string): Promise<void> {
    if (await this.isSetupComplete()) {
      throw new ServiceError('Admin account already exists', 400);
    }
    if (!password || password.length < 8) {
      throw new ServiceError('Password must be at least 8 characters', 400);
    }
    const hash = await hashPassword(password);
    await this.db
      .insertInto('admin_credentials')
      .values({ id: 'default', password_hash: hash, created_at: new Date().toISOString() })
      .execute();
  }

  async passwordLogin(password: string): Promise<UserInfo> {
    const row = await this.db
      .selectFrom('admin_credentials')
      .select('password_hash')
      .where('id', '=', 'default')
      .executeTakeFirst();
    if (!row) {
      throw new ServiceError('Admin account not set up', 400);
    }
    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) {
      throw new ServiceError('Invalid password', 401);
    }
    return {
      sub: 'local-admin',
      email: 'admin@local',
      name: 'Admin',
      role: 'admin',
    };
  }

  isOidcConfigured(): boolean {
    return !!(this.config.oidc.issuer && this.config.oidc.clientId && this.config.oidc.issuer !== 'disabled');
  }

  isPasswordAuthEnabled(): boolean {
    return !this.config.disablePasswordAuth;
  }

  // --- OIDC auth ---

  async getOidcConfig(): Promise<OidcConfig> {
    if (cachedOidcConfig && Date.now() - cachedOidcConfig.fetchedAt < CACHE_TTL_MS) {
      return cachedOidcConfig.data;
    }
    const res = await fetch(`${this.config.oidc.issuer}/.well-known/openid-configuration`);
    if (!res.ok) throw new ServiceError('Failed to fetch OIDC configuration', 500);
    const data = (await res.json()) as OidcConfig;
    cachedOidcConfig = { data, fetchedAt: Date.now() };
    return data;
  }

  async getJwks(): Promise<{ keys: Array<JsonWebKey & { kid?: string; alg?: string }> }> {
    if (cachedJwks && Date.now() - cachedJwks.fetchedAt < CACHE_TTL_MS) {
      return cachedJwks.data;
    }
    const config = await this.getOidcConfig();
    const res = await fetch(config.jwks_uri);
    if (!res.ok) throw new ServiceError('Failed to fetch JWKS', 500);
    const data = (await res.json()) as { keys: Array<JsonWebKey & { kid?: string; alg?: string }> };
    cachedJwks = { data, fetchedAt: Date.now() };
    return data;
  }

  async getAuthorizationUrl(state: string, nonce: string): Promise<string> {
    const config = await this.getOidcConfig();
    const params = new URLSearchParams({
      client_id: this.config.oidc.clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: this.config.oidc.redirectUri,
      state,
      nonce,
    });
    return `${config.authorization_endpoint}?${params}`;
  }

  async exchangeCode(code: string): Promise<{ id_token: string; access_token: string }> {
    const config = await this.getOidcConfig();
    const res = await fetch(config.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.oidc.clientId,
        client_secret: this.config.oidc.clientSecret,
        code,
        redirect_uri: this.config.oidc.redirectUri,
      }),
    });
    if (!res.ok) {
      throw new ServiceError('Token exchange failed', 500);
    }
    return res.json() as Promise<{ id_token: string; access_token: string }>;
  }

  async validateIdToken(idToken: string, nonce: string): Promise<UserInfo> {
    // Decode JWT parts
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new ServiceError('Invalid ID token format', 400);

    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'))) as {
      kid?: string;
      alg?: string;
    };

    if (header.alg !== 'RS256') {
      throw new ServiceError(`Unsupported token algorithm: ${header.alg}`, 400);
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;

    // Verify claims
    if (payload.iss !== this.config.oidc.issuer) throw new ServiceError('Invalid issuer', 400);
    if (
      payload.aud !== this.config.oidc.clientId &&
      !(Array.isArray(payload.aud) && (payload.aud as string[]).includes(this.config.oidc.clientId))
    ) {
      throw new ServiceError('Invalid audience', 400);
    }
    if (payload.nonce !== nonce) throw new ServiceError('Invalid nonce', 400);
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) {
      throw new ServiceError('Token expired', 400);
    }

    // Verify signature using JWKS. If we can't find the key by `kid` in the
    // cached set, the IdP may have rotated keys since we last fetched — bust
    // the cache and retry once before failing.
    let jwks = await this.getJwks();
    let key = header.kid ? jwks.keys.find((k) => k.kid === header.kid) : jwks.keys[0];
    if (!key && header.kid) {
      cachedJwks = null;
      jwks = await this.getJwks();
      key = jwks.keys.find((k) => k.kid === header.kid);
    }
    if (!key) throw new ServiceError('No matching signing key found', 400);

    const signingKey = await crypto.subtle.importKey(
      'jwk',
      key,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signatureValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      signingKey,
      Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );

    if (!signatureValid) throw new ServiceError('Invalid token signature', 400);

    // Extract role from configurable claim
    const role = this.extractRole(payload);

    return {
      sub: payload.sub as string,
      email: (payload.email as string) ?? '',
      name: (payload.name as string) ?? (payload.preferred_username as string) ?? '',
      role,
    };
  }

  private extractRole(claims: Record<string, unknown>): 'admin' | 'editor' | 'viewer' {
    const claimPath = this.config.oidc.roleClaim;
    let value: unknown = claims;

    // Support nested claims like "realm_access.roles"
    for (const part of claimPath.split('.')) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return 'viewer';
      }
    }

    if (Array.isArray(value)) {
      if (value.includes(this.config.oidc.roleMapAdmin)) return 'admin';
      if (value.includes(this.config.oidc.roleMapEditor)) return 'editor';
      return 'viewer';
    }

    if (typeof value === 'string') {
      if (value === this.config.oidc.roleMapAdmin) return 'admin';
      if (value === this.config.oidc.roleMapEditor) return 'editor';
    }

    return 'viewer';
  }

  async createSessionToken(user: UserInfo): Promise<string> {
    if (!this.config.sessionSecret) {
      throw new ServiceError('SESSION_SECRET is not configured', 500);
    }
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: user.sub,
        email: user.email,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
      }),
    );

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.config.sessionSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
    const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `${header}.${payload}.${signature}`;
  }

  async validateSessionToken(token: string): Promise<UserInfo | null> {
    return verifySessionToken(token, this.config.sessionSecret);
  }
}
