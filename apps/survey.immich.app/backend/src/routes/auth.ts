import { AuthService } from '../services/auth.service';
import { ServiceError } from '../services/errors';
import { SESSION_COOKIE_NAME, AUTH_STATE_COOKIE_NAME, SESSION_MAX_AGE } from '../constants';
import type { AppRouter } from '../types';

export function registerAuthRoutes(router: AppRouter) {
  // Check auth status + setup state
  router.get('/api/auth/me', async (request, env) => {
    const authService = new AuthService(env);
    const setupComplete = await authService.isSetupComplete();

    const passwordEnabled = authService.isPasswordAuthEnabled();
    const oidcEnabled = authService.isOidcConfigured();

    if (!setupComplete && passwordEnabled) {
      return Response.json({ authenticated: false, needsSetup: true, passwordEnabled, oidcEnabled });
    }

    const cookies = request.headers.get('cookie') ?? '';
    const match = cookies.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
    if (!match) {
      return Response.json({ authenticated: false, passwordEnabled, oidcEnabled });
    }

    const user = await authService.validateSessionToken(match[1]);
    if (!user) {
      return Response.json({ authenticated: false, passwordEnabled, oidcEnabled });
    }

    return Response.json({ authenticated: true, user, passwordEnabled, oidcEnabled });
  });

  // Initial admin setup (first-time password)
  router.post('/api/auth/setup', async (request, env) => {
    const authService = new AuthService(env);
    if (!authService.isPasswordAuthEnabled()) {
      throw new ServiceError('Password authentication is disabled', 400);
    }

    const body = (await request.json()) as { password?: string };
    if (!body.password) throw new ServiceError('Password is required', 400);

    await authService.setupAdmin(body.password);

    // Auto-login after setup
    const user = await authService.passwordLogin(body.password);
    const sessionToken = await authService.createSessionToken(user);

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
      },
    });
  });

  // Password login
  router.post('/api/auth/password-login', async (request, env) => {
    const authService = new AuthService(env);
    if (!authService.isPasswordAuthEnabled()) {
      throw new ServiceError('Password authentication is disabled', 400);
    }

    const body = (await request.json()) as { password?: string };
    if (!body.password) throw new ServiceError('Password is required', 400);
    const user = await authService.passwordLogin(body.password);
    const sessionToken = await authService.createSessionToken(user);

    return new Response(JSON.stringify({ success: true, user }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
      },
    });
  });

  // OIDC login redirect (only if OIDC is configured)
  router.get('/api/auth/login', async (request, env) => {
    const authService = new AuthService(env);
    if (!authService.isOidcConfigured()) {
      throw new ServiceError('OIDC is not configured', 400);
    }

    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const url = new URL(request.url);
    const returnTo = url.searchParams.get('returnTo') ?? '/';

    const authUrl = await authService.getAuthorizationUrl(state, nonce);
    const stateData = JSON.stringify({ state, nonce, returnTo });

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
        'Set-Cookie': `${AUTH_STATE_COOKIE_NAME}=${encodeURIComponent(stateData)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=120`,
      },
    });
  });

  // OIDC callback
  router.get('/api/auth/callback', async (request, env) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) throw new ServiceError('Authentication failed', 400);
    if (!code || !returnedState) throw new ServiceError('Missing code or state', 400);

    const cookies = request.headers.get('cookie') ?? '';
    const stateMatch = cookies.match(new RegExp(`(?:^|;\\s*)${AUTH_STATE_COOKIE_NAME}=([^;]*)`));
    if (!stateMatch) throw new ServiceError('Missing auth state cookie', 400);

    const stateData = JSON.parse(decodeURIComponent(stateMatch[1])) as {
      state: string;
      nonce: string;
      returnTo: string;
    };
    if (stateData.state !== returnedState) throw new ServiceError('State mismatch', 400);

    const authService = new AuthService(env);
    const tokens = await authService.exchangeCode(code);
    const user = await authService.validateIdToken(tokens.id_token, stateData.nonce);
    const sessionToken = await authService.createSessionToken(user);

    return new Response(null, {
      status: 302,
      headers: new Headers([
        ['Location', stateData.returnTo || '/'],
        [
          'Set-Cookie',
          `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
        ],
        ['Set-Cookie', `${AUTH_STATE_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`],
      ]),
    });
  });

  // Logout
  router.post('/api/auth/logout', async () => {
    return new Response(null, {
      status: 204,
      headers: {
        'Set-Cookie': `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`,
      },
    });
  });
}
