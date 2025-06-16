import { plainToClass } from 'class-transformer';
import { AutoRouter, IRequest } from 'itty-router';
import { AuthRequestValidator } from './validators';
import { validate } from 'class-validator';
import jwt from '@tsndr/cloudflare-worker-jwt';
import { DateTime } from 'luxon';
import { handleError } from './utils';

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
		throw new Error(`Invalid metadata format, please ensure it matches the required schema: ${JSON.stringify(errors)}`);
	}

	// dev environment
	if (env.CF_TURNSTILE_SECRET === 'DEV_TURNSTILE_TOKEN') {
		return await constructJWT(env.JWT_SECRET);
	}

	const ip = request.headers.get('CF-Connecting-IP');
	const token = request.headers.get('Turnstile-Token');
	if (!token || !ip) {
		return handleError('Missing turnstile validation information');
	}

	// Validate the token by calling the
	// CF "/siteverify" API endpoint.
	const formData = new FormData();
	formData.append('secret', env.CF_TURNSTILE_SECRET);
	formData.append('response', token);
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
			uploadID: verifiedToken.payload.sub,
		};
	} catch (error) {
		console.log('Token verification failed: ', error);
		return handleError('Invalid or expired token', 401);
	}
}
