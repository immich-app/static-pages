import { IRequest } from 'itty-router';

export async function withTurnstile(request: IRequest, env: Env) {
	// dev environment
	if (env.CF_TURNSTILE_SECRET === 'DEV_TOKEN') {
		return;
	}

	const ip = request.headers.get('CF-Connecting-IP');
	const token = request.headers.get('Turnstile-Token');
	if (!token || !ip) {
		return new Response('Missing turnstile validation information', { status: 400 });
	}

	// Validate the token by calling the
	// "/siteverify" API endpoint.
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
		return new Response('Turnstile validation failed', { status: 403 });
	}
}
