import { PBKDF2_ITERATIONS } from '../constants';

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {return false;}
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function hashPassword(password: string): Promise<string> {
  if (!password) {throw new Error('Password cannot be empty');}
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return `${saltB64}:${hashB64}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':', 2);
  if (!saltB64 || !hashB64) {return false;}
  const salt = Uint8Array.from(atob(saltB64), (c: string) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  const computedB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return constantTimeEqual(computedB64, hashB64);
}

export async function signToken(data: string, secret: string): Promise<string> {
  if (!secret) {throw new Error('Signing secret is not configured');}
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function verifyToken(data: string, token: string, secret: string): Promise<boolean> {
  const expected = await signToken(data, secret);
  return constantTimeEqual(expected, token);
}

export function passwordFingerprint(passwordHash: string | null | undefined): string {
  if (!passwordHash) {return 'none';}
  let h1 = 0x81_1C_9D_C5;
  let h2 = 0x01_00_01_93;
  for (let i = 0; i < passwordHash.length; i++) {
    const c = passwordHash.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01_00_01_93) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85_EB_CA_6B) >>> 0;
  }
  return h1.toString(36) + h2.toString(36);
}
