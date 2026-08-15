import { AuthService } from '../services/auth.service';
import { ServiceError } from '../services/errors';
import { SESSION_COOKIE_NAME, AUTH_STATE_COOKIE_NAME, SESSION_MAX_AGE } from '../constants';
import { getCookie } from '../cookie';
import { constantTimeEqual } from '../utils/crypto';
import { getContext } from '../config';
import type { AppRouter } from '../types';

export function registerAuthRoutes(router: AppRouter) {
  router.get('/api/auth/me', async (request) => {
    const ctx = getContext(request);
    const authService = new AuthService(ctx.config, ctx.db);
    const setupComplete = await authService.isSetupComplete();

    const passwordEnabled = authService.isPasswordAuthEnabled();
    const oidcEnabled = authService.isOidcConfigured();

    if (!setupComplete && passwordEnabled) {
      return Response.json({
        authenticated: false,
        needsSetup: true,
        needsSetupToken: !!ctx.config.setupToken,
        passwordEnabled,
        oidcEnabled,
      });
    }

    const sessionToken = getCookie(request, SESSION_COOKIE_NAME);
    if (!sessionToken) {
      return Response.json({ authenticated: false, passwordEnabled, oidcEnabled });
    }

    const user = await authService.validateSessionToken(sessionToken);
    if (!user) {
      return Response.json({ authenticated: false, passwordEnabled, oidcEnabled });
    }

    return Response.json({ authenticated: true, user, passwordEnabled, oidcEnabled });
  });

  router.post('/api/auth/setup', async (request) => {
    const ctx = getContext(request);
    const authService = new AuthService(ctx.config, ctx.db);
    if (!authService.isPasswordAuthEnabled()) {
      throw new ServiceError('Password authentication is disabled', 400);
    }

    if (ctx.config.setupToken) {
      const provided = request.headers.get('X-Setup-Token') ?? '';
      if (!constantTimeEqual(provided, ctx.config.setupToken)) {
        throw new ServiceError('A valid setup token is required to claim this instance', 403);
      }
    }

    const body = (await request.json()) as { password?: string };
    if (!body.password) throw new ServiceError('Password is required', 400);

    await authService.setupAdmin(body.password);

    const user = await authService.passwordLogin(body.password);
    const sessionToken = await authService.createSessionToken(user);
    const secure = ctx.config.cookieSecure ? 'Secure; ' : '';

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
      },
    });
  });

  router.post('/api/auth/password-login', async (request) => {
    const ctx = getContext(request);
    const authService = new AuthService(ctx.config, ctx.db);
    if (!authService.isPasswordAuthEnabled()) {
      throw new ServiceError('Password authentication is disabled', 400);
    }

    const body = (await request.json()) as { password?: string };
    if (!body.password) throw new ServiceError('Password is required', 400);
    const user = await authService.passwordLogin(body.password);
    const sessionToken = await authService.createSessionToken(user);
    const secure = ctx.config.cookieSecure ? 'Secure; ' : '';

    return new Response(JSON.stringify({ success: true, user }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
      },
    });
  });

  router.get('/api/auth/login', async (request) => {
    const ctx = getContext(request);
    const authService = new AuthService(ctx.config, ctx.db);
    if (!authService.isOidcConfigured()) {
      throw new ServiceError('OIDC is not configured', 400);
    }

    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const url = new URL(request.url);
    const rawReturnTo = url.searchParams.get('returnTo') ?? '/';
    // Parse against this origin rather than prefix-checking: the WHATWG parser
    // folds `\` to `/`, so `/\evil.com` resolves to `//evil.com` — an open
    // redirect off the trusted SSO origin (CWE-601).
    let returnTo = '/';
    try {
      const target = new URL(rawReturnTo, url.origin);
      if (target.origin === url.origin) {
        returnTo = target.pathname + target.search + target.hash;
      }
    } catch {
      // Invalid URL — fall back to the safe default
    }

    const authUrl = await authService.getAuthorizationUrl(state, nonce);
    const stateData = JSON.stringify({ state, nonce, returnTo });
    const secure = ctx.config.cookieSecure ? 'Secure; ' : '';

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
        'Set-Cookie': `${AUTH_STATE_COOKIE_NAME}=${encodeURIComponent(stateData)}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=120`,
      },
    });
  });

  router.get('/api/auth/callback', async (request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) throw new ServiceError('Authentication failed', 400);
    if (!code || !returnedState) throw new ServiceError('Missing code or state', 400);

    const stateCookie = getCookie(request, AUTH_STATE_COOKIE_NAME);
    if (!stateCookie) throw new ServiceError('Missing auth state cookie', 400);

    let stateData: { state: string; nonce: string; returnTo: string };
    try {
      stateData = JSON.parse(decodeURIComponent(stateCookie));
    } catch {
      throw new ServiceError('Invalid auth state', 400);
    }
    if (stateData.state !== returnedState) throw new ServiceError('State mismatch', 400);

    const ctx = getContext(request);
    const authService = new AuthService(ctx.config, ctx.db);
    const tokens = await authService.exchangeCode(code);
    const user = await authService.validateIdToken(tokens.id_token, stateData.nonce, tokens.access_token);
    const sessionToken = await authService.createSessionToken(user);
    const secure = ctx.config.cookieSecure ? 'Secure; ' : '';

    return new Response(null, {
      status: 302,
      headers: new Headers([
        ['Location', stateData.returnTo || '/'],
        [
          'Set-Cookie',
          `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
        ],
        ['Set-Cookie', `${AUTH_STATE_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`],
      ]),
    });
  });

  router.post('/api/auth/logout', async () => {
    return new Response(null, {
      status: 204,
      headers: {
        'Set-Cookie': `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`,
      },
    });
  });
}
