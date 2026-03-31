import { describe, expect, it } from 'vitest';
import { request, getAdminCookie, ADMIN_PASSWORD } from './helpers';

describe('Authentication', () => {
  it('POST /api/auth/password-login succeeds with correct password', async () => {
    // Ensure admin is set up first
    await getAdminCookie();
    const res = await request('/api/auth/password-login', {
      method: 'POST',
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('survey_session=');
  });

  it('POST /api/auth/password-login fails with wrong password', async () => {
    const res = await request('/api/auth/password-login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong-password' }),
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/password-login fails with empty password', async () => {
    const res = await request('/api/auth/password-login', {
      method: 'POST',
      body: JSON.stringify({ password: '' }),
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/auth/me with valid cookie returns authenticated user', async () => {
    const cookie = await getAdminCookie();
    const res = await request('/api/auth/me', { cookie });
    const data = (await res.json()) as { authenticated: boolean; user?: { role: string; email: string } };
    expect(data.authenticated).toBe(true);
    expect(data.user?.role).toBe('admin');
  });

  it('GET /api/auth/me without cookie returns unauthenticated', async () => {
    const res = await request('/api/auth/me');
    const data = (await res.json()) as { authenticated: boolean };
    // Might be needsSetup or just unauthenticated depending on state
    expect(data.authenticated).toBe(false);
  });

  it('POST /api/auth/logout clears session cookie', async () => {
    const res = await request('/api/auth/logout', { method: 'POST' });
    expect(res.status).toBe(204);
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('admin endpoints return 401 without auth', async () => {
    const res = await request('/api/surveys');
    expect(res.status).toBe(401);
  });

  it('admin endpoints work with valid auth', async () => {
    const cookie = await getAdminCookie();
    const res = await request('/api/surveys', { cookie });
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/setup fails when already set up', async () => {
    await getAdminCookie(); // ensure setup
    const res = await request('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ password: 'another-password-123' }),
    });
    expect(res.status).toBe(400);
  });

  it('invalid session cookie returns 401', async () => {
    const res = await request('/api/surveys', {
      cookie: 'survey_session=invalid.token.here',
    });
    expect(res.status).toBe(401);
  });
});
