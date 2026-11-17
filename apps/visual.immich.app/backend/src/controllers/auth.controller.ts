import { deleteCookie, setCookie } from 'hono/cookie';
import { Constants } from '../constants';
import { CallbackCookieSchema, CallbackQuerySchema, LoginQuerySchema } from '../dtos/auth.dto';
import { controller, route } from '../router';

export const authController = controller('/auth', [
  route({
    method: 'GET',
    path: '/login',
    auth: { public: true },
    query: LoginQuerySchema,
    handler: async ({ ctx, origin, query, services }) => {
      const { url, loginState } = await services.auth.startLogin({ origin, returnTo: query.returnTo });

      setCookie(
        ctx,
        Constants.Cookies.OAuthState.Name,
        JSON.stringify(loginState),
        Constants.Cookies.OAuthState.Options,
      );

      return ctx.redirect(url);
    },
  }),

  route({
    method: 'GET',
    path: '/callback',
    auth: { public: true },
    query: CallbackQuerySchema,
    cookies: CallbackCookieSchema,
    handler: async ({ ctx, cookies, services }) => {
      const loginState = cookies[Constants.Cookies.OAuthState.Name];
      const { token, returnTo } = await services.auth.finishLogin({ url: ctx.req.url, loginState });

      setCookie(ctx, Constants.Cookies.Session.Name, token, Constants.Cookies.Session.Options);
      deleteCookie(ctx, Constants.Cookies.OAuthState.Name, Constants.Cookies.OAuthState.Options);

      return ctx.redirect(returnTo);
    },
  }),
]);
