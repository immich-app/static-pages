const API = process.env.API_URL || 'http://localhost:8787';
const ADMIN_PASSWORD = 'integration-test-password';

let adminCookie: string | null = null;

export async function request(path: string, options?: RequestInit & { cookie?: string }): Promise<Response> {
  const { cookie, ...fetchOptions } = options ?? {};
  const headers: Record<string, string> = {};
  if (fetchOptions.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (cookie) {
    headers['Cookie'] = cookie;
  }
  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }
  return fetch(`${API}${path}`, { ...fetchOptions, headers });
}

export async function authedRequest(path: string, options?: RequestInit): Promise<Response> {
  const cookie = await getAdminCookie();
  return request(path, { ...options, cookie });
}

export async function getAdminCookie(): Promise<string> {
  if (adminCookie) return adminCookie;

  const meRes = await request('/api/auth/me');
  const me = (await meRes.json()) as { needsSetup?: boolean };

  if (me.needsSetup) {
    const setupRes = await request('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });
    const setCookie = setupRes.headers.get('set-cookie');
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
      return adminCookie;
    }
  }

  const loginRes = await request('/api/auth/password-login', {
    method: 'POST',
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    adminCookie = setCookie.split(';')[0];
  }

  if (!adminCookie) throw new Error('Failed to authenticate for integration tests');
  return adminCookie;
}

export async function createPublishedSurvey(options?: {
  title?: string;
  slug?: string;
  password?: string;
}): Promise<{ surveyId: string; slug: string; sectionId: string; questionIds: string[] }> {
  const title = options?.title ?? `Test Survey ${Date.now()}`;
  const slug = options?.slug ?? `test-${Date.now()}`;

  const surveyRes = await authedRequest('/api/surveys', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  const survey = (await surveyRes.json()) as { id: string };

  await authedRequest(`/api/surveys/${survey.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      slug,
      ...(options?.password ? { password: options.password } : {}),
    }),
  });

  const sectionRes = await authedRequest(`/api/surveys/${survey.id}/sections`, {
    method: 'POST',
    body: JSON.stringify({ title: 'Section 1' }),
  });
  const section = (await sectionRes.json()) as { id: string };

  const questionIds: string[] = [];
  for (const q of [
    {
      text: 'Pick one',
      type: 'radio',
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
      ],
    },
    { text: 'Your name', type: 'text' },
    { text: 'Rate us', type: 'nps' },
  ]) {
    const qRes = await authedRequest(`/api/sections/${section.id}/questions`, {
      method: 'POST',
      body: JSON.stringify(q),
    });
    const question = (await qRes.json()) as { id: string };
    questionIds.push(question.id);
  }

  await authedRequest(`/api/surveys/${survey.id}/publish`, { method: 'PUT' });

  return { surveyId: survey.id, slug, sectionId: section.id, questionIds };
}

const DEV_SESSION_SECRET = 'dev-session-secret-DO-NOT-USE-IN-PRODUCTION';
const SESSION_COOKIE_NAME = 'survey_session';

export async function createCookieForRole(role: 'admin' | 'editor' | 'viewer'): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: `test-${role}`,
      email: `${role}@test.local`,
      name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
    }),
  );

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(DEV_SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${SESSION_COOKIE_NAME}=${header}.${payload}.${signature}`;
}

export { ADMIN_PASSWORD };
