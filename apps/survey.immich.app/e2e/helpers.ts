const API = process.env.API_URL || 'http://localhost:8787';
const TEST_PASSWORD = 'e2e-test-password-12345';

let sessionCookie: string | null = null;

export async function ensureAuth(): Promise<string> {
  if (sessionCookie) return sessionCookie;

  // Check if setup is needed
  const meRes = await fetch(`${API}/api/auth/me`);
  const me = (await meRes.json()) as { authenticated: boolean; needsSetup?: boolean };

  if (me.needsSetup) {
    // First-time setup
    const setupRes = await fetch(`${API}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    });
    const cookie = setupRes.headers.get('set-cookie');
    if (cookie) {
      sessionCookie = cookie.split(';')[0];
      return sessionCookie;
    }
  }

  // Already set up — login
  const loginRes = await fetch(`${API}/api/auth/password-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD }),
  });
  const cookie = loginRes.headers.get('set-cookie');
  if (cookie) {
    sessionCookie = cookie.split(';')[0];
  }

  if (!sessionCookie) {
    throw new Error('Failed to authenticate for E2E tests');
  }
  return sessionCookie;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }
  return headers;
}

export async function apiPost(path: string, body?: unknown) {
  await ensureAuth();
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok && res.status !== 201) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return undefined;
  return res.json();
}

export async function apiPut(path: string, body?: unknown) {
  await ensureAuth();
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${path} failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return undefined;
  return res.json();
}

export async function apiGet(path: string) {
  await ensureAuth();
  const res = await fetch(`${API}${path}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function apiRawGet(path: string) {
  await ensureAuth();
  return fetch(`${API}${path}`, {
    headers: getAuthHeaders(),
  });
}

export async function apiDelete(path: string) {
  await ensureAuth();
  return fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export function parseCookie(cookie: string): { name: string; value: string } {
  const idx = cookie.indexOf('=');
  return { name: cookie.slice(0, idx), value: cookie.slice(idx + 1) };
}

export { API, TEST_PASSWORD };
