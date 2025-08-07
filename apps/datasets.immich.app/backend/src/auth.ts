import jwt from '@tsndr/cloudflare-worker-jwt';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { AutoRouter, IRequest } from 'itty-router';
import { DateTime } from 'luxon';
import { handleError } from './utils';
import { AuthRequestValidator } from './validators';

export const authRouter = AutoRouter<IRequest, [Env, ExecutionContext]>({ base: '/api/auth' });

async function constructJWT(secret: string) {
  const now = DateTime.utc();
  const notBeforeTime = now.minus({ seconds: 10 }).toSeconds();
  const expiryTime = now.plus({ hours: 1 }).toSeconds();

  return {
    token: await jwt.sign(
      {
        sub: crypto.randomUUID(),
        nbf: notBeforeTime,
        exp: expiryTime,
      },
      secret,
    ),
  };
}

authRouter.post('/', async (request, env) => {
  const authRequest = plainToClass(AuthRequestValidator, await request.json());
  const errors = await validate(authRequest, { whitelist: true, forbidNonWhitelisted: true });

  if (errors.length > 0) {
    throw new Error(`Invalid token validation payload: ${JSON.stringify(errors)}`);
  }

  // dev environment
  if (env.CF_TURNSTILE_SECRET === 'DEV_TURNSTILE_TOKEN') {
    return await constructJWT(env.JWT_SECRET);
  }

  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) {
    return handleError('Missing turnstile validation information');
  }

  // Validate the token by calling the
  // CF "/siteverify" API endpoint.
  const formData = new FormData();
  formData.append('secret', env.CF_TURNSTILE_SECRET);
  formData.append('response', authRequest.turnstileToken);
  formData.append('remoteip', ip);

  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const result = await fetch(url, {
    body: formData,
    method: 'POST',
  });

  const outcome = (await result.json()) as { success: boolean };
  if (!outcome.success) {
    return handleError('Turnstile validation failed', 403);
  }

  return await constructJWT(env.JWT_SECRET);
});

export async function withJWTAuth(request: IRequest, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return handleError('Missing Authorization header', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return handleError('Invalid Authorization header format', 401);
  }

  try {
    const verifiedToken = await jwt.verify(token, env.JWT_SECRET, { throwError: true });

    if (!verifiedToken) {
      return handleError('Invalid or expired token', 401);
    }

    request.extras = {
      authID: verifiedToken.payload.sub,
    };
  } catch {
    return handleError('Invalid or expired token', 401);
  }
}
