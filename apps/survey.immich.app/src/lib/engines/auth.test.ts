import { describe, it, expect } from 'vitest';
import type { AuthUser } from '../types';

// ── Pure-function replicas of auth logic for testing ─────────────────────

type UserRole = 'admin' | 'editor' | 'viewer';

interface UserInfo {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

const ROLE_HIERARCHY: Record<UserRole, number> = { admin: 3, editor: 2, viewer: 1 };

/**
 * Mirrors `requireRole` from backend/src/middleware/auth.ts
 */
function requireRole(user: UserInfo | undefined, minRole: UserRole): void {
  if (!user) throw new Error('Authentication required');
  if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
    throw new Error('Insufficient permissions');
  }
}

/**
 * Mirrors `AuthService.extractRole` from backend/src/services/auth.service.ts
 */
function extractRole(
  claims: Record<string, unknown>,
  claimPath: string,
  adminValue: string,
  editorValue: string,
): UserRole {
  let value: unknown = claims;

  for (const part of claimPath.split('.')) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part];
    } else {
      return 'viewer';
    }
  }

  if (Array.isArray(value)) {
    if (value.includes(adminValue)) return 'admin';
    if (value.includes(editorValue)) return 'editor';
    return 'viewer';
  }

  if (typeof value === 'string') {
    if (value === adminValue) return 'admin';
    if (value === editorValue) return 'editor';
  }

  return 'viewer';
}

/**
 * Mirrors `getAuth().hasRole()` from stores/auth.svelte.ts
 */
function hasRole(user: AuthUser | null, minRole: UserRole): boolean {
  if (!user) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
}

/**
 * Validates basic JWT structure (3 base64url-encoded dot-separated parts).
 */
function isValidJwtStructure(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    for (const part of parts.slice(0, 2)) {
      JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds a fake session JWT for testing (mirrors AuthService.createSessionToken structure,
 * without real HMAC — just tests the payload shape).
 */
function createTestJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const fakeSignature = btoa('test-signature');
  return `${header}.${body}.${fakeSignature}`;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function makeUser(role: UserRole): UserInfo {
  return { sub: 'user-1', email: 'user@example.com', name: 'Test User', role };
}

// ═════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════

describe('Role hierarchy — requireRole', () => {
  it('admin user passes admin minRole', () => {
    expect(() => requireRole(makeUser('admin'), 'admin')).not.toThrow();
  });

  it('admin user passes editor minRole', () => {
    expect(() => requireRole(makeUser('admin'), 'editor')).not.toThrow();
  });

  it('admin user passes viewer minRole', () => {
    expect(() => requireRole(makeUser('admin'), 'viewer')).not.toThrow();
  });

  it('editor user fails admin minRole', () => {
    expect(() => requireRole(makeUser('editor'), 'admin')).toThrow('Insufficient permissions');
  });

  it('editor user passes editor minRole', () => {
    expect(() => requireRole(makeUser('editor'), 'editor')).not.toThrow();
  });

  it('editor user passes viewer minRole', () => {
    expect(() => requireRole(makeUser('editor'), 'viewer')).not.toThrow();
  });

  it('viewer user fails admin minRole', () => {
    expect(() => requireRole(makeUser('viewer'), 'admin')).toThrow('Insufficient permissions');
  });

  it('viewer user fails editor minRole', () => {
    expect(() => requireRole(makeUser('viewer'), 'editor')).toThrow('Insufficient permissions');
  });

  it('viewer user passes viewer minRole', () => {
    expect(() => requireRole(makeUser('viewer'), 'viewer')).not.toThrow();
  });

  it('throws for undefined user', () => {
    expect(() => requireRole(undefined, 'viewer')).toThrow('Authentication required');
  });

  it('throws for undefined user even with viewer minRole', () => {
    expect(() => requireRole(undefined, 'admin')).toThrow('Authentication required');
  });

  it('hierarchy values: admin=3, editor=2, viewer=1', () => {
    expect(ROLE_HIERARCHY.admin).toBe(3);
    expect(ROLE_HIERARCHY.editor).toBe(2);
    expect(ROLE_HIERARCHY.viewer).toBe(1);
  });

  it('admin >= all roles', () => {
    const adminLevel = ROLE_HIERARCHY.admin;
    expect(adminLevel).toBeGreaterThanOrEqual(ROLE_HIERARCHY.admin);
    expect(adminLevel).toBeGreaterThanOrEqual(ROLE_HIERARCHY.editor);
    expect(adminLevel).toBeGreaterThanOrEqual(ROLE_HIERARCHY.viewer);
  });

  it('editor >= editor and viewer but not admin', () => {
    const editorLevel = ROLE_HIERARCHY.editor;
    expect(editorLevel).toBeLessThan(ROLE_HIERARCHY.admin);
    expect(editorLevel).toBeGreaterThanOrEqual(ROLE_HIERARCHY.editor);
    expect(editorLevel).toBeGreaterThanOrEqual(ROLE_HIERARCHY.viewer);
  });

  it('viewer >= viewer only', () => {
    const viewerLevel = ROLE_HIERARCHY.viewer;
    expect(viewerLevel).toBeLessThan(ROLE_HIERARCHY.admin);
    expect(viewerLevel).toBeLessThan(ROLE_HIERARCHY.editor);
    expect(viewerLevel).toBeGreaterThanOrEqual(ROLE_HIERARCHY.viewer);
  });
});

describe('Role hierarchy — client-side hasRole', () => {
  it('returns false for null user', () => {
    expect(hasRole(null, 'viewer')).toBe(false);
  });

  it('admin has admin role', () => {
    expect(hasRole({ sub: '1', email: '', name: '', role: 'admin' }, 'admin')).toBe(true);
  });

  it('editor does not have admin role', () => {
    expect(hasRole({ sub: '1', email: '', name: '', role: 'editor' }, 'admin')).toBe(false);
  });

  it('editor has viewer role', () => {
    expect(hasRole({ sub: '1', email: '', name: '', role: 'editor' }, 'viewer')).toBe(true);
  });
});

describe('Role extraction from OIDC claims', () => {
  const adminValue = 'survey-admin';
  const editorValue = 'survey-editor';

  it('extracts admin from flat array claim', () => {
    const claims = { roles: ['survey-admin', 'other-role'] };
    expect(extractRole(claims, 'roles', adminValue, editorValue)).toBe('admin');
  });

  it('extracts editor from flat array claim', () => {
    const claims = { roles: ['survey-editor', 'other-role'] };
    expect(extractRole(claims, 'roles', adminValue, editorValue)).toBe('editor');
  });

  it('extracts admin from flat string claim', () => {
    const claims = { role: 'survey-admin' };
    expect(extractRole(claims, 'role', adminValue, editorValue)).toBe('admin');
  });

  it('extracts editor from flat string claim', () => {
    const claims = { role: 'survey-editor' };
    expect(extractRole(claims, 'role', adminValue, editorValue)).toBe('editor');
  });

  it('defaults to viewer when claim is missing', () => {
    const claims = { other: 'value' };
    expect(extractRole(claims, 'roles', adminValue, editorValue)).toBe('viewer');
  });

  it('defaults to viewer when claim value does not match any mapping', () => {
    const claims = { roles: ['unrelated-role'] };
    expect(extractRole(claims, 'roles', adminValue, editorValue)).toBe('viewer');
  });

  it('extracts from nested claim path (realm_access.roles)', () => {
    const claims = { realm_access: { roles: ['survey-admin'] } };
    expect(extractRole(claims, 'realm_access.roles', adminValue, editorValue)).toBe('admin');
  });

  it('extracts editor from nested claim path', () => {
    const claims = { realm_access: { roles: ['survey-editor'] } };
    expect(extractRole(claims, 'realm_access.roles', adminValue, editorValue)).toBe('editor');
  });

  it('admin is checked before editor (priority)', () => {
    const claims = { roles: ['survey-editor', 'survey-admin'] };
    expect(extractRole(claims, 'roles', adminValue, editorValue)).toBe('admin');
  });

  it('empty array returns viewer', () => {
    const claims = { roles: [] };
    expect(extractRole(claims, 'roles', adminValue, editorValue)).toBe('viewer');
  });

  it('non-array, non-string value returns viewer', () => {
    const claims = { roles: 42 };
    expect(extractRole(claims, 'roles', adminValue, editorValue)).toBe('viewer');
  });

  it('null claim value returns viewer', () => {
    const claims = { roles: null };
    expect(extractRole(claims, 'roles', adminValue, editorValue)).toBe('viewer');
  });

  it('deeply nested missing intermediate returns viewer', () => {
    const claims = { realm_access: 'not-an-object' };
    expect(extractRole(claims, 'realm_access.roles', adminValue, editorValue)).toBe('viewer');
  });

  it('string claim with unrecognized value returns viewer', () => {
    const claims = { role: 'unknown-role' };
    expect(extractRole(claims, 'role', adminValue, editorValue)).toBe('viewer');
  });
});

describe('Session JWT structure', () => {
  it('valid JWT has 3 dot-separated parts', () => {
    const token = createTestJwt({ sub: 'u1', email: 'a@b.com', name: 'A', role: 'admin', iat: 1000, exp: 9999 });
    expect(token.split('.').length).toBe(3);
  });

  it('isValidJwtStructure accepts well-formed token', () => {
    const token = createTestJwt({ sub: 'u1' });
    expect(isValidJwtStructure(token)).toBe(true);
  });

  it('JWT payload contains expected claims', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = { sub: 'u1', email: 'a@b.com', name: 'User', role: 'editor', iat: now, exp: now + 3600 };
    const token = createTestJwt(payload);
    const decoded = decodeJwtPayload(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('u1');
    expect(decoded!.email).toBe('a@b.com');
    expect(decoded!.name).toBe('User');
    expect(decoded!.role).toBe('editor');
    expect(decoded!.iat).toBe(now);
    expect(decoded!.exp).toBe(now + 3600);
  });

  it('expired JWT is detected by checking exp < now', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const payload = { sub: 'u1', exp: pastExp };
    const token = createTestJwt(payload);
    const decoded = decodeJwtPayload(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.exp).toBeLessThan(Date.now() / 1000);
  });

  it('tampered payload changes decoded content', () => {
    const token = createTestJwt({ sub: 'u1', role: 'admin' });
    const parts = token.split('.');
    // Tamper the payload
    const tampered = btoa(JSON.stringify({ sub: 'u1', role: 'viewer' }));
    const tamperedToken = `${parts[0]}.${tampered}.${parts[2]}`;
    const decoded = decodeJwtPayload(tamperedToken);
    expect(decoded).not.toBeNull();
    expect(decoded!.role).toBe('viewer'); // content changed — signature would fail in real validation
  });

  it('isValidJwtStructure rejects token with missing parts', () => {
    expect(isValidJwtStructure('header.payload')).toBe(false);
  });

  it('isValidJwtStructure rejects empty string', () => {
    expect(isValidJwtStructure('')).toBe(false);
  });

  it('isValidJwtStructure rejects token with 4 parts', () => {
    expect(isValidJwtStructure('a.b.c.d')).toBe(false);
  });

  it('role is preserved through create/decode cycle', () => {
    for (const role of ['admin', 'editor', 'viewer'] as const) {
      const token = createTestJwt({ sub: 'u1', role });
      const decoded = decodeJwtPayload(token);
      expect(decoded!.role).toBe(role);
    }
  });

  it('decodeJwtPayload returns null for invalid token', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
  });

  it('JWT header contains alg and typ', () => {
    const token = createTestJwt({ sub: 'u1' });
    const headerPart = token.split('.')[0];
    const header = JSON.parse(atob(headerPart));
    expect(header.alg).toBe('HS256');
    expect(header.typ).toBe('JWT');
  });
});
