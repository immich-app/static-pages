import { applyD1Migrations, reset } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import {
  type IdentityProfile,
  type IdentityProvider,
  ISSUER,
  newIdentityProvider,
  newSigningKey,
} from './identity-provider';
import { getSetCookies, send, signIn, startLogin } from './utils';

const approver: IdentityProfile = {
  sub: 'user-1',
  email: 'approver@immich.app',
  name: 'Approver',
  role: 'visual-approver',
};

describe('auth', () => {
  const sut = app;
  let idp: IdentityProvider;

  beforeEach(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
    idp = await newIdentityProvider();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    await reset();
  });

  describe('GET /api/auth/login', () => {
    it('redirects to the identity provider', async () => {
      const { response, authorizationUrl } = await startLogin(sut);

      const url = new URL(authorizationUrl);
      expect(response.status).toBe(302);
      expect(url.origin + url.pathname).toBe(`${ISSUER}/oauth/v2/authorize`);
      expect(Object.fromEntries(url.searchParams)).toEqual({
        response_type: 'code',
        client_id: 'visual-client',
        redirect_uri: 'https://visual.immich.app/api/auth/callback',
        scope: 'openid email profile',
        state: expect.stringMatching(/^[\w-]{20,}$/),
        nonce: expect.stringMatching(/^[\w-]{20,}$/),
        code_challenge: expect.stringMatching(/^[\w-]{43}$/),
        code_challenge_method: 'S256',
      });
    });

    it('keeps the login state in an http only cookie', async () => {
      const { response } = await startLogin(sut);

      expect(new Set(getSetCookies(response).visual_oauth_state.attributes)).toEqual(
        new Set(['Path=/api/auth', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=300']),
      );
    });
  });

  describe('GET /api/auth/callback', () => {
    it('signs the user in', async () => {
      const { response, sessionCookie } = await signIn(sut, idp, approver);

      const me = await send(sut, '/api/users/me', [sessionCookie]);
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('https://visual.immich.app/');
      await expect(me.json()).resolves.toEqual({
        id: expect.any(String),
        email: 'approver@immich.app',
        name: 'Approver',
        role: 'approver',
      });
    });

    it('keeps the session in an http only cookie for 7 days', async () => {
      const { response } = await signIn(sut, idp, approver);

      expect(new Set(getSetCookies(response).visual_access_token.attributes)).toEqual(
        new Set(['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=604800']),
      );
    });

    it('returns to the page that started the login', async () => {
      const { authorizationUrl, stateCookie } = await startLogin(sut, '/api/auth/login?returnTo=%2Fbuilds%3Fpage%3D2');
      const { code, state } = idp.authorize(authorizationUrl, approver);

      const response = await send(sut, `/api/auth/callback?code=${code}&state=${state}`, [stateCookie]);

      expect(response.headers.get('location')).toBe('https://visual.immich.app/builds?page=2');
    });

    it.each(['https://evil.test/', '//evil.test', String.raw`/\evil.test`, '/.//evil.test'])(
      'does not return to another site (%s)',
      async (returnTo) => {
        const login = await startLogin(sut, `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
        const { code, state } = idp.authorize(login.authorizationUrl, approver);

        const response = await send(sut, `/api/auth/callback?code=${code}&state=${state}`, [login.stateCookie]);

        expect(URL.parse(response.headers.get('location') ?? '')?.origin).toBe('https://visual.immich.app');
      },
    );

    it('signs a viewer in as a viewer', async () => {
      const { sessionCookie } = await signIn(sut, idp, { ...approver, role: 'visual-viewer' });

      const me = await send(sut, '/api/users/me', [sessionCookie]);
      await expect(me.json()).resolves.toMatchObject({ role: 'viewer' });
    });

    it('updates the user on the next sign in', async () => {
      const first = await signIn(sut, idp, { ...approver, role: 'visual-viewer', name: 'Old Name' });
      const firstMe = await send(sut, '/api/users/me', [first.sessionCookie]);

      const second = await signIn(sut, idp, { ...approver, role: 'visual-approver', name: 'New Name' });

      const secondMe = await send(sut, '/api/users/me', [second.sessionCookie]);
      const before = (await firstMe.json()) as { id: string };
      await expect(secondMe.json()).resolves.toEqual({
        id: before.id,
        email: 'approver@immich.app',
        name: 'New Name',
        role: 'approver',
      });
    });

    it('rejects a user without a visual role', async () => {
      const { response, sessionCookie } = await signIn(sut, idp, { ...approver, role: undefined });

      expect(response.status).toBe(403);
      expect(sessionCookie).toBe('');
    });

    it('rejects a profile without an email', async () => {
      const { email: _email, ...profile } = approver;

      const { response, sessionCookie } = await signIn(sut, idp, profile as IdentityProfile);

      expect(response.status).toBe(400);
      expect(sessionCookie).toBe('');
    });

    it('rejects a state that does not match the login', async () => {
      const { authorizationUrl, stateCookie } = await startLogin(sut);
      const { code } = idp.authorize(authorizationUrl, approver);

      const response = await send(sut, `/api/auth/callback?code=${code}&state=other-state`, [stateCookie]);

      expect(response.status).toBe(400);
      expect(getSetCookies(response).visual_access_token).toBeUndefined();
    });

    it('rejects a callback without the login cookie', async () => {
      const { authorizationUrl } = await startLogin(sut);
      const { code, state } = idp.authorize(authorizationUrl, approver);

      const response = await send(sut, `/api/auth/callback?code=${code}&state=${state}`);

      expect(response.status).toBe(400);
    });

    it.each(['not-json', '%7B%7D', '%7B%22state%22%3A1%7D'])('rejects a malformed login cookie (%s)', async (value) => {
      const { authorizationUrl } = await startLogin(sut);
      const { code, state } = idp.authorize(authorizationUrl, approver);

      const response = await send(sut, `/api/auth/callback?code=${code}&state=${state}`, [
        `visual_oauth_state=${value}`,
      ]);

      expect(response.status).toBe(400);
    });

    it.each(['state=abc', 'code=abc', 'code=&state=abc'])(
      'rejects a callback with an incomplete query (%s)',
      async (query) => {
        const { stateCookie } = await startLogin(sut);

        const response = await send(sut, `/api/auth/callback?${query}`, [stateCookie]);

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({ message: 'Validation failed' });
      },
    );

    it('lists the fields that failed validation', async () => {
      const { stateCookie } = await startLogin(sut);

      const response = await send(sut, '/api/auth/callback?state=abc', [stateCookie]);

      await expect(response.json()).resolves.toEqual({
        message: 'Validation failed',
        errors: [expect.objectContaining({ code: 'invalid_type', path: ['code'], message: expect.any(String) })],
      });
    });

    it('rejects a code the identity provider does not know', async () => {
      const { authorizationUrl, stateCookie } = await startLogin(sut);
      const { state } = idp.authorize(authorizationUrl, approver);

      const response = await send(sut, `/api/auth/callback?code=unknown&state=${state}`, [stateCookie]);

      expect(response.status).toBe(400);
    });

    it('rejects an id token issued for another login', async () => {
      const { authorizationUrl, stateCookie } = await startLogin(sut);
      const { code, state } = idp.authorize(authorizationUrl, approver, { nonce: 'another-login' });

      const response = await send(sut, `/api/auth/callback?code=${code}&state=${state}`, [stateCookie]);

      expect(response.status).toBe(400);
      expect(getSetCookies(response).visual_access_token).toBeUndefined();
    });

    it('rejects an id token signed by another key', async () => {
      const { authorizationUrl, stateCookie } = await startLogin(sut);
      const signingKey = await newSigningKey('key-1');
      const { code, state } = idp.authorize(authorizationUrl, approver, { signingKey });

      const response = await send(sut, `/api/auth/callback?code=${code}&state=${state}`, [stateCookie]);

      expect(response.status).toBe(400);
      expect(getSetCookies(response).visual_access_token).toBeUndefined();
    });
  });

  describe('GET /api/users/me', () => {
    it('requires a session', async () => {
      const response = await send(sut, '/api/users/me');

      expect(response.status).toBe(401);
    });

    it('rejects an unknown session token', async () => {
      const response = await send(sut, '/api/users/me', ['visual_access_token=unknown']);

      expect(response.status).toBe(401);
    });

    it('rejects a session after 7 days', async () => {
      vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-01T00:00:00Z') });
      const { sessionCookie } = await signIn(sut, idp, approver);
      vi.setSystemTime(new Date('2026-11-07T23:59:59Z'));
      const beforeExpiry = await send(sut, '/api/users/me', [sessionCookie]);

      vi.setSystemTime(new Date('2026-11-08T00:00:00Z'));
      const afterExpiry = await send(sut, '/api/users/me', [sessionCookie]);

      expect(beforeExpiry.status).toBe(200);
      expect(afterExpiry.status).toBe(401);
    });
  });
});
