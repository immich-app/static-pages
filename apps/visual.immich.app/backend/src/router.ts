import { type Context, type ErrorHandler, Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { z, ZodType } from 'zod';
import { Constants } from './constants';
import type { AuthDto } from './dtos/auth.dto';
import { ClientError, ValidationError } from './errors';
import { createServices, type Services } from './services';
import type { AppEnv } from './types';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type PublicAuth = { public: true };

type Infer<Schema> = Schema extends ZodType ? z.infer<Schema> : undefined;

type RouteRequest<Query, Cookies, Auth> = {
  ctx: Context<AppEnv>;
  origin: string;
  services: Services;
  auth: Auth extends PublicAuth ? undefined : AuthDto;
  query: Infer<Query>;
  cookies: Infer<Cookies>;
};

type RouteOptions<Query, Cookies, Auth> = {
  method: Method;
  path: string;
  auth?: Auth;
  query?: Query;
  cookies?: Cookies;
  handler: (request: RouteRequest<Query, Cookies, Auth>) => unknown;
};

export type Route = { method: Method; path: string; handle: (ctx: Context<AppEnv>) => Promise<Response> };

export const router = (basePath: string, controllers: Hono<AppEnv>[]) => {
  const app = new Hono<AppEnv>().basePath(basePath).onError(handleError);
  for (const item of controllers) {
    app.route('/', item);
  }

  return app;
};

export const controller = (basePath: string, routes: Route[]) => {
  const app = new Hono<AppEnv>().basePath(basePath);
  for (const { method, path, handle } of routes) {
    app.on(method, path, handle);
  }

  return app;
};

export const route = <
  Query extends ZodType | undefined = undefined,
  Cookies extends ZodType | undefined = undefined,
  Auth extends PublicAuth | undefined = undefined,
>(
  options: RouteOptions<Query, Cookies, Auth>,
): Route => ({
  method: options.method,
  path: options.path,
  handle: async (ctx) => {
    const services = createServices(ctx.env);
    const auth = options.auth?.public
      ? undefined
      : await services.auth.authenticate(getCookie(ctx, Constants.Cookies.Session.Name));
    const result = await options.handler({
      ctx,
      origin: new URL(ctx.req.url).origin,
      services,
      auth: auth as RouteRequest<Query, Cookies, Auth>['auth'],
      query: parse(options.query as Query, ctx.req.query()),
      cookies: parse(options.cookies as Cookies, getCookie(ctx)),
    });

    return result instanceof Response ? result : ctx.json(result);
  },
});

const parse = <Schema extends ZodType | undefined>(schema: Schema, value: unknown): Infer<Schema> => {
  const result = schema?.safeParse(value);
  if (result?.success === false) {
    throw new ValidationError(result.error.issues);
  }

  return result?.data as Infer<Schema>;
};

const handleError: ErrorHandler<AppEnv> = (error, ctx) => {
  if (error instanceof ClientError) {
    if (error.cause) {
      console.warn(error.message, error.cause);
    }

    return ctx.json(error.getResponse(), error.status);
  }

  console.error(error);

  return ctx.json({ message: 'Internal server error' }, 500);
};
