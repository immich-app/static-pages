interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface AuthState {
  authenticated: boolean;
  user?: AuthUser;
  needsSetup?: boolean;
  oidcEnabled?: boolean;
  passwordEnabled?: boolean;
}

export async function getMe(): Promise<AuthState> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return { authenticated: false };
    return res.json() as Promise<AuthState>;
  } catch {
    return { authenticated: false };
  }
}

export async function setup(password: string): Promise<void> {
  const res = await fetch('/api/auth/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Setup failed' }));
    throw new Error((body as { error?: string }).error ?? 'Setup failed');
  }
}

export async function passwordLogin(password: string): Promise<void> {
  const res = await fetch('/api/auth/password-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error((body as { error?: string }).error ?? 'Login failed');
  }
}

export function oidcLogin(returnTo?: string): void {
  const url = new URL('/api/auth/login', window.location.origin);
  if (returnTo) url.searchParams.set('returnTo', returnTo);
  window.location.href = url.toString();
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
}
