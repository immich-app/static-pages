/**
 * Session-token helpers: standalone from AuthService so contexts without a
 * `db` handle (DO routing path, tests) can validate a session cookie using
 * only the HMAC secret. AuthService.validateSessionToken delegates here so
 * the two verification paths can't drift.
 */

import type { UserInfo } from '../services/auth.service';

function b64urlToBytes(s: string): Uint8Array {
  return Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
}

export async function verifySessionToken(token: string, sessionSecret: string): Promise<UserInfo | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(sessionSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;

    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null;
    if (typeof payload.sub !== 'string') return null;

    return {
      sub: payload.sub,
      email: (payload.email as string) ?? '',
      name: (payload.name as string) ?? '',
      role: (payload.role as UserInfo['role']) ?? 'viewer',
    };
  } catch {
    return null;
  }
}
