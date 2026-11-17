import { vi } from 'vitest';

export const ISSUER = 'https://idp.test';
export const CLIENT_ID = 'visual-client';
export const CLIENT_SECRET = 'visual-secret';

export type IdentityProfile = { sub: string; email: string; name: string; role?: string };

type SigningKey = { kid: string; privateKey: CryptoKey; jwk: JsonWebKey & { kid: string } };

const base64Url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCodePoint(...new Uint8Array(bytes)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

const encode = (value: unknown) => base64Url(new TextEncoder().encode(JSON.stringify(value)));

export const newSigningKey = async (kid: string): Promise<SigningKey> => {
  const algorithm = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  };
  const { privateKey, publicKey } = (await crypto.subtle.generateKey(algorithm, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey('jwk', publicKey)) as JsonWebKey;

  return { kid, privateKey, jwk: { ...jwk, kid, alg: 'RS256', use: 'sig' } };
};

const newIdToken = async (key: SigningKey, claims: Record<string, unknown>) => {
  const content = `${encode({ alg: 'RS256', typ: 'JWT', kid: key.kid })}.${encode(claims)}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key.privateKey, new TextEncoder().encode(content));

  return `${content}.${base64Url(signature)}`;
};

const defaultSigningKey = newSigningKey('key-1');

export const newIdentityProvider = async () => {
  type Grant = {
    profile: IdentityProfile;
    nonce: string;
    redirectUri: string;
    codeChallenge: string;
    signingKey: SigningKey;
  };

  const signingKey = await defaultSigningKey;
  const grants = new Map<string, Grant>();
  const accessTokens = new Map<string, IdentityProfile>();

  const handleToken = async (request: Request) => {
    const form = await request.formData();
    const code = String(form.get('code'));
    const grant = grants.get(code);
    const verifier = new TextEncoder().encode(String(form.get('code_verifier')));
    const codeChallenge = base64Url(await crypto.subtle.digest('SHA-256', verifier));
    const isValid =
      grant &&
      form.get('grant_type') === 'authorization_code' &&
      form.get('client_id') === CLIENT_ID &&
      form.get('client_secret') === CLIENT_SECRET &&
      form.get('redirect_uri') === grant.redirectUri &&
      codeChallenge === grant.codeChallenge;
    if (!isValid) {
      return Response.json({ error: 'invalid_grant' }, { status: 400 });
    }

    grants.delete(code);
    const accessToken = `access-${grant.profile.sub}`;
    accessTokens.set(accessToken, grant.profile);
    const now = Math.floor(Date.now() / 1000);
    const idToken = await newIdToken(grant.signingKey, {
      iss: ISSUER,
      aud: CLIENT_ID,
      sub: grant.profile.sub,
      nonce: grant.nonce,
      iat: now,
      exp: now + 300,
    });

    return Response.json({ access_token: accessToken, token_type: 'Bearer', id_token: idToken });
  };

  const handleUserinfo = (request: Request) => {
    const profile = accessTokens.get(request.headers.get('authorization')?.replace('Bearer ', '') ?? '');
    if (!profile) {
      return Response.json({ error: 'invalid_token' }, { status: 401 });
    }

    return Response.json(profile);
  };

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const request = new Request(input, init);
    switch (`${request.method} ${request.url}`) {
      case `GET ${ISSUER}/.well-known/openid-configuration`: {
        return Response.json({
          issuer: ISSUER,
          authorization_endpoint: `${ISSUER}/oauth/v2/authorize`,
          token_endpoint: `${ISSUER}/oauth/v2/token`,
          userinfo_endpoint: `${ISSUER}/oidc/v1/userinfo`,
          jwks_uri: `${ISSUER}/oauth/v2/keys`,
          response_types_supported: ['code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
          code_challenge_methods_supported: ['S256'],
        });
      }

      case `GET ${ISSUER}/oauth/v2/keys`: {
        return Response.json({ keys: [signingKey.jwk] });
      }

      case `POST ${ISSUER}/oauth/v2/token`: {
        return handleToken(request);
      }

      case `GET ${ISSUER}/oidc/v1/userinfo`: {
        return handleUserinfo(request);
      }

      default: {
        throw new Error(`Unexpected request: ${request.method} ${request.url}`);
      }
    }
  });

  return {
    authorize: (authorizationUrl: string, profile: IdentityProfile, overrides: Partial<Grant> = {}) => {
      const { searchParams } = new URL(authorizationUrl);
      const code = `code-${grants.size + 1}-${profile.sub}`;
      grants.set(code, {
        profile,
        nonce: searchParams.get('nonce') ?? '',
        redirectUri: searchParams.get('redirect_uri') ?? '',
        codeChallenge: searchParams.get('code_challenge') ?? '',
        signingKey,
        ...overrides,
      });

      return { code, state: searchParams.get('state') ?? '' };
    },
  };
};

export type IdentityProvider = Awaited<ReturnType<typeof newIdentityProvider>>;
