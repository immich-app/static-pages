import { env } from 'cloudflare:workers';
import { app } from '../src/app';
import { CLIENT_ID, CLIENT_SECRET, type IdentityProfile, type IdentityProvider, ISSUER } from './identity-provider';

export const ORIGIN = 'https://visual.immich.app';

export const testEnv = (): Env => ({
  ...env,
  OAUTH_ISSUER: ISSUER,
  OAUTH_CLIENT_ID: CLIENT_ID,
  OAUTH_CLIENT_SECRET: CLIENT_SECRET,
});

export type App = typeof app;

export const send = (sut: App, path: string, cookies: string[] = []) =>
  sut.request(`${ORIGIN}${path}`, { headers: { cookie: cookies.join('; ') } }, testEnv());

export const getSetCookies = (response: Response) =>
  Object.fromEntries(
    response.headers.getSetCookie().map((cookie) => {
      const [pair, ...attributes] = cookie.split('; ');
      const [name, ...value] = pair.split('=');

      return [name, { value: value.join('='), pair, attributes }];
    }),
  );

export const startLogin = async (sut: App, path = '/api/auth/login') => {
  const response = await send(sut, path);

  return {
    response,
    authorizationUrl: response.headers.get('location') ?? '',
    stateCookie: getSetCookies(response).visual_oauth_state?.pair ?? '',
  };
};

export const signIn = async (sut: App, idp: IdentityProvider, profile: IdentityProfile) => {
  const { authorizationUrl, stateCookie } = await startLogin(sut);
  const { code, state } = idp.authorize(authorizationUrl, profile);
  const response = await send(sut, `/api/auth/callback?code=${code}&state=${state}`, [stateCookie]);

  return { response, sessionCookie: getSetCookies(response).visual_access_token?.pair ?? '' };
};
