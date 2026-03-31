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
      redirect_uris: ['http://localhost:8787/api/auth/callback'],
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
  jwks: {
    keys: [
      {
        kty: 'RSA',
        kid: 'test-key-1',
        use: 'sig',
        alg: 'RS256',
        // 2048-bit RSA key for test purposes only
        n: 'wJENwS-k8fVpSPGSVMD1RGUPVdGO0g1iQLRWUEQ2rFelPg5J8KxqRN9JqnFCBCXmj5yNqvagBJ_lTFRKQkMiCxOzG9eo-LXJrQiCj7RzfOPNOSTh9F9JBXvdKNO0UdAy_VNFPhQGLUqBVKZmMOBg3P7bqVXOTfz7WJLhx6QFWBEP2EHkfVJZGfxJb2M_5W-3F_0x3Cs1oSDq_I92T1qrfp1k5O0Rn18Rp7M0ev9L3P6nGUbw4qKy1JBPFHC-9e-P5M2XNPV3g4pYJqz7E_j5fLJKq0KZgGnPb8PVA0wL8CqVs2xQNaWK6l5I7fM5j0rG51xfANKd4b2z7N0Qqb8IW0Q',
        e: 'AQAB',
        d: 'Dj5lsVLsMP0I1PjS-OchNGAN2E3I9KHD_FnrES3lXCrSxPzF8Dv5UZjDLYf4gMsK7dD4r7p7Qy_0uJIiIIaY0w5V3DkQnLfH1Kv-YWFNV0lZUvG8X_DKBXBQ7t8Dx1DLT7P1p3oZwqDR3QZplKD5UXNYnY3R7nTqFmW3-w7AKi3u2JLGPCZV1Rt6p3BoLHtZPfOp-A4QdB6X0Y_LkvOS3g39v8oq8OHxNr5JlX8aA7dA7W9LpF3p4w3LOm9dMeXb4fWlFnQXP--pBUP5JWRH-fD-_J-Y5qJKkj1e78Bxh9HMXadZhQVBk-T7d-9XkQV3RlnXN4BqR3W51T4Dt-AeEQ',
        p: '5ym0E-vxKSPAJ9LZ0qyEl4I0GIqHCz5SBSFiDArmulJO7nrjR_0DUf3gAoj8pz7E-qs-x0fjdT_RTUBN3JNgVrV10j4PczWk8PBzrhJ7YAXWBR6phIvSVeU0alK5OxjPVi8BQLZ-F1pK9F3uMOkbWv8GZQh-ChLSzNgJ-A8Y5_U',
        q: '1gy3xIX0jPb7VkPRHSbePTFC_vkJlquU2axCisjj3YbZOfuVDe-bMjEUCTN9LHFr4Q0ID8_rFJqIbYI_-GfaJ-sP_0X8S2a3ERtbo0Z_qqPdhHPPNXcXS-WqG5nfDL5k6gDK_WTHNCn3Y7GXR1Ocufem_pREVG0fHXJf9ib52UlQ',
        dp: 'Xh0JcWNdPPgjQ_5F1hI0vVIJjcewky0WlV5uZPO3hJVF_lOvYD8JI-u-dPRqGJsHe_Y1Cv9z1WOYqFJ5RQWJKSqn7v7OkFD_4eYW7P2QReHqMYVVc3dNHYDn04SyaFjxIoV7eN-mMPjwPb-JqAS8BHQB4tQXtLQT0j7MYFhnIU',
        dq: 'GjHbbU0fHJgJ3EGTpw-E6k7J4b4MBq0Q0rVJkp-PFN3Jdl3RMz9SEtR9fA15PmLJAhJxS7ERjE-aB5EKQ7d0EkxXN2X6w7-cLWnE-J5yfqBZqUnAOSHR0LE7EFXG0q_aJ6tEsH2JHrR93HduZ-S7Gqo-GyJdBwJlI7C7FPC2PaQ',
        qi: 'xL_JyNwXfU3LJ_2SdGASB_r31lVTu_bJxzVdTLR4hFQFV4H2Sw0r0g7JQJJIFKZiG9BVO3FP-0HXagc3mPGPWncZA9WJXu9Jv_vAfJ7V_XZAL_DR0zxKP4RBWWJ7tu4NKQJV_h9VNB9C2gb3LDsYX_a6GNN3jRIoSV3oyWPdps',
      },
    ],
  },
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
