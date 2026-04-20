import Provider, { type AccountClaims, type FindAccount, type Configuration } from 'oidc-provider';

const ISSUER = 'http://localhost:9090';
const CLIENT_ID = 'survey-app';
const CLIENT_SECRET = 'test-client-secret';

interface TestUser {
  password: string;
  claims: AccountClaims & { groups: string[] };
}

const TEST_USERS: Record<string, TestUser> = {
  'admin@test.com': {
    password: 'testpassword',
    claims: {
      sub: 'test-admin-1',
      email: 'admin@test.com',
      email_verified: true,
      name: 'Test Admin',
      groups: ['survey-admin'],
    },
  },
  'editor@test.com': {
    password: 'testpassword',
    claims: {
      sub: 'test-editor-1',
      email: 'editor@test.com',
      email_verified: true,
      name: 'Test Editor',
      groups: ['survey-editor'],
    },
  },
  'viewer@test.com': {
    password: 'testpassword',
    claims: {
      sub: 'test-viewer-1',
      email: 'viewer@test.com',
      email_verified: true,
      name: 'Test Viewer',
      groups: [],
    },
  },
};

const findAccount: FindAccount = async (_ctx, id) => {
  const entry = Object.entries(TEST_USERS).find(([, u]) => u.claims.sub === id);
  if (!entry) return undefined;
  const [, user] = entry;
  return {
    accountId: user.claims.sub,
    async claims() {
      return user.claims;
    },
  };
};

function authenticateUser(login: string, password: string) {
  const user = TEST_USERS[login];
  if (!user || user.password !== password) return undefined;
  return { accountId: user.claims.sub };
}

const configuration: Configuration = {
  clients: [
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uris: [
        'http://localhost:8787/api/auth/callback',
        'http://localhost:5173/api/auth/callback',
        'http://localhost:3000/api/auth/callback',
        'http://localhost:4444/api/auth/callback',
      ],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
    },
  ],
  findAccount,
  claims: {
    openid: ['sub'],
    email: ['email', 'email_verified'],
    profile: ['name', 'groups'],
  },
  scopes: ['openid', 'email', 'profile'],
  features: {
    devInteractions: { enabled: false },
  },
  // Include all claims in the id_token (not just via userinfo endpoint)
  conformIdTokenClaims: false,
  pkce: {
    required: () => false,
  },
  interactions: {
    url(_ctx, interaction) {
      return `/interaction/${interaction.uid}`;
    },
  },
  cookies: {
    keys: ['oidc-test-secret-key-1'],
  },
  // Let oidc-provider generate keys at startup (avoids Node.js v24 crypto compat issues with static keys)
};

export async function startOidcServer(): Promise<{
  server: ReturnType<Provider['listen']>;
  stop: () => Promise<void>;
}> {
  const provider = new Provider(ISSUER, configuration);

  // Mount interaction routes as koa middleware (runs before oidc-provider routes)
  provider.use(async (ctx, next) => {
    const url = ctx.URL;

    // GET /interaction/:uid — render login or consent form
    const interactionGetMatch = url.pathname.match(/^\/interaction\/([^/]+)$/);
    if (interactionGetMatch && ctx.method === 'GET') {
      const uid = interactionGetMatch[1];
      try {
        const details = await provider.interactionDetails(ctx.req, ctx.res);
        if (details.prompt.name === 'login') {
          ctx.type = 'text/html';
          ctx.body = `<!DOCTYPE html>
<html><body>
<form method="post" action="/interaction/${uid}/login">
  <input name="login" placeholder="Email" type="text" />
  <input name="password" placeholder="Password" type="password" />
  <button type="submit">Sign in</button>
</form>
</body></html>`;
          return;
        }
        if (details.prompt.name === 'consent') {
          ctx.type = 'text/html';
          ctx.body = `<!DOCTYPE html>
<html><body>
<form method="post" action="/interaction/${uid}/confirm">
  <p>Authorize this application?</p>
  <button type="submit">Authorize</button>
</form>
</body></html>`;
          return;
        }
      } catch {
        ctx.status = 500;
        ctx.body = 'Interaction error';
        return;
      }
    }

    // POST /interaction/:uid/login — validate credentials and finish login
    if (ctx.method === 'POST' && url.pathname.match(/^\/interaction\/[^/]+\/login$/)) {
      const uid = url.pathname.split('/')[2];
      const body = await readBody(ctx.req);
      const params = new URLSearchParams(body);
      const login = params.get('login') ?? '';
      const password = params.get('password') ?? '';

      const account = authenticateUser(login, password);
      if (!account) {
        ctx.type = 'text/html';
        ctx.body = `<!DOCTYPE html>
<html><body>
<p class="error">Invalid credentials</p>
<form method="post" action="/interaction/${uid}/login">
  <input name="login" placeholder="Email" type="text" />
  <input name="password" placeholder="Password" type="password" />
  <button type="submit">Sign in</button>
</form>
</body></html>`;
        return;
      }

      const result = { login: { accountId: account.accountId } };
      await provider.interactionFinished(ctx.req, ctx.res, result, {
        mergeWithLastSubmission: false,
      });
      // interactionFinished writes the response directly — prevent koa from overwriting
      ctx.respond = false;
      return;
    }

    // POST /interaction/:uid/confirm — grant consent and finish
    if (ctx.method === 'POST' && url.pathname.match(/^\/interaction\/[^/]+\/confirm$/)) {
      try {
        const interactionDetails = await provider.interactionDetails(ctx.req, ctx.res);
        const {
          prompt: { details: promptDetails },
          params,
          session,
        } = interactionDetails;
        const accountId = session?.accountId;

        if (!accountId) {
          ctx.status = 400;
          ctx.body = 'No session';
          return;
        }

        let grant = interactionDetails.grantId
          ? await provider.Grant.find(interactionDetails.grantId)
          : new provider.Grant({ accountId, clientId: params.client_id as string });

        if (!grant) {
          grant = new provider.Grant({ accountId, clientId: params.client_id as string });
        }

        const missingOIDCScope = (promptDetails.missingOIDCScope as string[] | undefined) ?? [];
        if (missingOIDCScope.length > 0) {
          grant.addOIDCScope(missingOIDCScope.join(' '));
        }
        const missingOIDCClaims = (promptDetails.missingOIDCClaims as string[] | undefined) ?? [];
        if (missingOIDCClaims.length > 0) {
          grant.addOIDCClaims(missingOIDCClaims);
        }
        const missingResourceScopes =
          (promptDetails.missingResourceScopes as Record<string, string[]> | undefined) ?? {};
        for (const [indicator, scopes] of Object.entries(missingResourceScopes)) {
          grant.addResourceScope(indicator, scopes.join(' '));
        }

        const grantId = await grant.save();
        const result = { consent: { grantId } };
        await provider.interactionFinished(ctx.req, ctx.res, result, {
          mergeWithLastSubmission: true,
        });
        ctx.respond = false;
      } catch {
        ctx.status = 500;
        ctx.body = 'Consent error';
      }
      return;
    }

    // Everything else falls through to oidc-provider's built-in routes
    await next();
  });

  // Log errors from the provider
  provider.on('server_error', (ctx: unknown, err: Error) => {
    console.error('[OIDC server_error]', err.message, err.stack);
  });
  provider.on('grant.error', (ctx: unknown, err: Error) => {
    console.error('[OIDC grant.error]', err.message);
  });

  const server = provider.listen(9090);
  console.log('OIDC test server running on http://localhost:9090');

  return {
    server,
    stop: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Allow running standalone: `npx tsx e2e/oidc-server.ts`
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  startOidcServer().then(() => console.log('OIDC server started, press Ctrl+C to stop'));
}

export { ISSUER, CLIENT_ID, CLIENT_SECRET, TEST_USERS };
