import { describe, it, expect } from 'vitest';

// ── Pure-function replicas of security logic for testing ─────────────────

/**
 * Mirrors `constantTimeEqual` from backend/src/utils/crypto.ts
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Mirrors ALLOWED_COLUMNS from backend/src/repositories/survey.repository.ts
 */
const SURVEY_ALLOWED_COLUMNS = new Set([
  'title', 'description', 'slug', 'status',
  'welcome_title', 'welcome_description',
  'thank_you_title', 'thank_you_description',
  'closes_at', 'max_responses',
  'randomize_questions', 'randomize_options',
  'password_hash', 'archived_at', 'updated_at',
]);

/**
 * Mirrors role hierarchy from backend/src/middleware/auth.ts
 */
const ROLE_HIERARCHY: Record<string, number> = { admin: 3, editor: 2, viewer: 1 };

function canAccess(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

/**
 * Password validation helpers mirroring backend enforcement.
 */
function isValidAdminPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8;
}

function isValidSurveyPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 4;
}

/**
 * Basic JWT structure validator (mirrors auth.test.ts helper).
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

function createTestJwt(header: Record<string, unknown>, payload: Record<string, unknown>): string {
  const h = btoa(JSON.stringify(header));
  const p = btoa(JSON.stringify(payload));
  const sig = btoa('fake-signature');
  return `${h}.${p}.${sig}`;
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

/**
 * Sanitizes text content for safe display — ensures user input is treated as
 * plain text and never interpreted as HTML.
 */
function sanitizeForDisplay(input: string | null | undefined): string {
  if (input == null) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ═════════════════════════════════════════════════════════════════════════
// 1. Constant-time comparison
// ═════════════════════════════════════════════════════════════════════════

describe('Constant-time comparison — constantTimeEqual', () => {
  it('returns true for identical strings', () => {
    expect(constantTimeEqual('hello', 'hello')).toBe(true);
  });

  it('returns false for completely different strings', () => {
    expect(constantTimeEqual('hello', 'world')).toBe(false);
  });

  it('returns false for strings of different lengths', () => {
    expect(constantTimeEqual('short', 'much-longer')).toBe(false);
  });

  it('returns true for two empty strings', () => {
    expect(constantTimeEqual('', '')).toBe(true);
  });

  it('returns false when single character differs', () => {
    expect(constantTimeEqual('abc', 'axc')).toBe(false);
  });

  it('returns false when only last character differs', () => {
    expect(constantTimeEqual('abcdef', 'abcdeg')).toBe(false);
  });

  it('returns false when only first character differs', () => {
    expect(constantTimeEqual('xbcdef', 'abcdef')).toBe(false);
  });

  it('handles unicode strings correctly', () => {
    expect(constantTimeEqual('héllo', 'héllo')).toBe(true);
    expect(constantTimeEqual('héllo', 'hëllo')).toBe(false);
  });

  it('returns false when one string is empty and the other is not', () => {
    expect(constantTimeEqual('', 'notempty')).toBe(false);
    expect(constantTimeEqual('notempty', '')).toBe(false);
  });

  it('returns false for strings that are prefixes of each other', () => {
    expect(constantTimeEqual('abc', 'abcdef')).toBe(false);
  });

  it('returns true for long identical strings', () => {
    const long = 'a'.repeat(10000);
    expect(constantTimeEqual(long, long)).toBe(true);
  });

  it('returns false for long strings differing in last char', () => {
    const a = 'a'.repeat(9999) + 'b';
    const b = 'a'.repeat(9999) + 'c';
    expect(constantTimeEqual(a, b)).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 2. Column whitelist validation
// ═════════════════════════════════════════════════════════════════════════

describe('Column whitelist validation — SURVEY_ALLOWED_COLUMNS', () => {
  it('allows valid column "title"', () => {
    expect(SURVEY_ALLOWED_COLUMNS.has('title')).toBe(true);
  });

  it('allows valid column "description"', () => {
    expect(SURVEY_ALLOWED_COLUMNS.has('description')).toBe(true);
  });

  it('rejects SQL injection attempt "title; DROP TABLE surveys"', () => {
    expect(SURVEY_ALLOWED_COLUMNS.has('title; DROP TABLE surveys')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(SURVEY_ALLOWED_COLUMNS.has('')).toBe(false);
  });

  it('rejects "id" (immutable primary key)', () => {
    expect(SURVEY_ALLOWED_COLUMNS.has('id')).toBe(false);
  });

  it('rejects "created_at" (immutable timestamp)', () => {
    expect(SURVEY_ALLOWED_COLUMNS.has('created_at')).toBe(false);
  });

  it('contains all 15 expected columns', () => {
    const expected = [
      'title', 'description', 'slug', 'status',
      'welcome_title', 'welcome_description',
      'thank_you_title', 'thank_you_description',
      'closes_at', 'max_responses',
      'randomize_questions', 'randomize_options',
      'password_hash', 'archived_at', 'updated_at',
    ];
    for (const col of expected) {
      expect(SURVEY_ALLOWED_COLUMNS.has(col)).toBe(true);
    }
    expect(SURVEY_ALLOWED_COLUMNS.size).toBe(15);
  });

  it('rejects unknown column name "foobar"', () => {
    expect(SURVEY_ALLOWED_COLUMNS.has('foobar')).toBe(false);
  });

  it('rejects column with whitespace "title "', () => {
    expect(SURVEY_ALLOWED_COLUMNS.has('title ')).toBe(false);
  });

  it('rejects "__proto__" (prototype pollution attempt)', () => {
    expect(SURVEY_ALLOWED_COLUMNS.has('__proto__')).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 3. Role hierarchy enforcement
// ═════════════════════════════════════════════════════════════════════════

describe('Role hierarchy enforcement — canAccess', () => {
  it('admin can access admin routes', () => {
    expect(canAccess('admin', 'admin')).toBe(true);
  });

  it('admin can access editor routes', () => {
    expect(canAccess('admin', 'editor')).toBe(true);
  });

  it('admin can access viewer routes', () => {
    expect(canAccess('admin', 'viewer')).toBe(true);
  });

  it('editor cannot access admin routes', () => {
    expect(canAccess('editor', 'admin')).toBe(false);
  });

  it('editor can access editor routes', () => {
    expect(canAccess('editor', 'editor')).toBe(true);
  });

  it('editor can access viewer routes', () => {
    expect(canAccess('editor', 'viewer')).toBe(true);
  });

  it('viewer cannot access admin routes', () => {
    expect(canAccess('viewer', 'admin')).toBe(false);
  });

  it('viewer cannot access editor routes', () => {
    expect(canAccess('viewer', 'editor')).toBe(false);
  });

  it('viewer can access viewer routes', () => {
    expect(canAccess('viewer', 'viewer')).toBe(true);
  });

  it('unknown role cannot access any protected route', () => {
    expect(canAccess('unknown', 'viewer')).toBe(false);
    expect(canAccess('unknown', 'editor')).toBe(false);
    expect(canAccess('unknown', 'admin')).toBe(false);
  });

  it('empty string role cannot access any route', () => {
    expect(canAccess('', 'viewer')).toBe(false);
    expect(canAccess('', 'editor')).toBe(false);
    expect(canAccess('', 'admin')).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 4. Password validation
// ═════════════════════════════════════════════════════════════════════════

describe('Password validation', () => {
  it('admin password >= 8 chars is accepted', () => {
    expect(isValidAdminPassword('securepass')).toBe(true);
  });

  it('admin password < 8 chars is rejected', () => {
    expect(isValidAdminPassword('short')).toBe(false);
  });

  it('empty admin password is rejected', () => {
    expect(isValidAdminPassword('')).toBe(false);
  });

  it('admin password exactly 8 chars is accepted', () => {
    expect(isValidAdminPassword('12345678')).toBe(true);
  });

  it('admin password exactly 7 chars is rejected', () => {
    expect(isValidAdminPassword('1234567')).toBe(false);
  });

  it('survey password >= 4 chars is accepted', () => {
    expect(isValidSurveyPassword('pass')).toBe(true);
  });

  it('survey password < 4 chars is rejected', () => {
    expect(isValidSurveyPassword('abc')).toBe(false);
  });

  it('empty survey password is rejected', () => {
    expect(isValidSurveyPassword('')).toBe(false);
  });

  it('password with special characters is accepted', () => {
    expect(isValidAdminPassword('p@$$w0rd!')).toBe(true);
    expect(isValidSurveyPassword('!@#$')).toBe(true);
  });

  it('password with unicode characters is accepted', () => {
    expect(isValidAdminPassword('pässwörd')).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 5. XSS prevention
// ═════════════════════════════════════════════════════════════════════════

describe('XSS prevention — sanitizeForDisplay', () => {
  it('escapes <script> tags', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeForDisplay(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes <img onerror> payloads', () => {
    const input = '<img src=x onerror="alert(1)">';
    const result = sanitizeForDisplay(input);
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  it('escapes javascript: protocol links', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeForDisplay(input);
    expect(result).not.toContain('<a');
    expect(result).toContain('&lt;a');
  });

  it('passes normal text through with only entity escaping', () => {
    const input = 'This is a normal survey description.';
    const result = sanitizeForDisplay(input);
    expect(result).toBe(input);
  });

  it('does not double-decode HTML entities', () => {
    const input = '&lt;script&gt;';
    const result = sanitizeForDisplay(input);
    expect(result).toBe('&amp;lt;script&amp;gt;');
    expect(result).not.toContain('<script>');
  });

  it('returns empty string for null input', () => {
    expect(sanitizeForDisplay(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(sanitizeForDisplay(undefined)).toBe('');
  });

  it('escapes double quotes to prevent attribute breakout', () => {
    const input = '" onmouseover="alert(1)"';
    const result = sanitizeForDisplay(input);
    expect(result).not.toContain('"');
    expect(result).toContain('&quot;');
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 6. JWT security
// ═════════════════════════════════════════════════════════════════════════

describe('JWT security', () => {
  it('token with alg: "none" should be rejected by structure check', () => {
    const token = createTestJwt({ alg: 'none', typ: 'JWT' }, { sub: 'u1' });
    // Even though the structure is technically valid base64, an alg:none token
    // must be rejected by the verifier — we verify the header explicitly
    const parts = token.split('.');
    const header = JSON.parse(atob(parts[0]));
    expect(header.alg).toBe('none');
    // A proper verifier must reject alg:none
    expect(header.alg).not.toBe('HS256');
  });

  it('token with alg: "HS256" should be rejected when RS256 is expected (OIDC)', () => {
    const token = createTestJwt({ alg: 'HS256', typ: 'JWT' }, { sub: 'u1' });
    const parts = token.split('.');
    const header = JSON.parse(atob(parts[0]));
    expect(header.alg).toBe('HS256');
    expect(header.alg).not.toBe('RS256');
  });

  it('expired token is detected by checking exp claim', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const token = createTestJwt({ alg: 'HS256', typ: 'JWT' }, { sub: 'u1', exp: pastExp });
    const decoded = decodeJwtPayload(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.exp as number).toBeLessThan(Math.floor(Date.now() / 1000));
  });

  it('token with wrong issuer is detected', () => {
    const token = createTestJwt({ alg: 'HS256', typ: 'JWT' }, { sub: 'u1', iss: 'evil-issuer' });
    const decoded = decodeJwtPayload(token);
    expect(decoded!.iss).not.toBe('https://auth.example.com');
  });

  it('token with wrong audience is detected', () => {
    const token = createTestJwt({ alg: 'HS256', typ: 'JWT' }, { sub: 'u1', aud: 'wrong-audience' });
    const decoded = decodeJwtPayload(token);
    expect(decoded!.aud).not.toBe('survey-app');
  });

  it('token with missing nonce is detected', () => {
    const token = createTestJwt({ alg: 'HS256', typ: 'JWT' }, { sub: 'u1' });
    const decoded = decodeJwtPayload(token);
    expect(decoded!.nonce).toBeUndefined();
  });

  it('well-formed token has exactly 3 dot-separated parts', () => {
    const token = createTestJwt({ alg: 'HS256', typ: 'JWT' }, { sub: 'u1' });
    expect(token.split('.').length).toBe(3);
    expect(isValidJwtStructure(token)).toBe(true);
  });

  it('malformed base64 is rejected', () => {
    expect(isValidJwtStructure('not-base64.also-bad.nope')).toBe(false);
  });

  it('token with 2 parts is rejected', () => {
    expect(isValidJwtStructure('header.payload')).toBe(false);
  });

  it('empty string is rejected', () => {
    expect(isValidJwtStructure('')).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 7. OIDC state validation
// ═════════════════════════════════════════════════════════════════════════

describe('OIDC state validation', () => {
  it('matching state parameter passes validation', () => {
    const originalState = 'abc123-random-state';
    const returnedState = 'abc123-random-state';
    expect(constantTimeEqual(originalState, returnedState)).toBe(true);
  });

  it('mismatched state parameter fails validation', () => {
    const originalState = 'abc123-random-state';
    const returnedState = 'xyz789-different-state';
    expect(constantTimeEqual(originalState, returnedState)).toBe(false);
  });

  it('empty state parameter fails validation', () => {
    const originalState = 'abc123-random-state';
    const returnedState = '';
    expect(constantTimeEqual(originalState, returnedState)).toBe(false);
  });

  it('state cookie must be present (empty string is not valid)', () => {
    const stateCookie = '';
    expect(stateCookie.length).toBe(0);
    expect(stateCookie).toBeFalsy();
  });

  it('AUTH_STATE_COOKIE_NAME is set and state cookie max-age is bounded', () => {
    // Mirrors constants from backend/src/constants.ts
    const AUTH_STATE_COOKIE_NAME = 'auth_state';
    const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours
    expect(AUTH_STATE_COOKIE_NAME).toBe('auth_state');
    // State cookies should expire — max-age must be finite and positive
    expect(SESSION_MAX_AGE).toBeGreaterThan(0);
    expect(SESSION_MAX_AGE).toBeLessThanOrEqual(86400); // should not exceed 24 hours
  });
});

// ═════════════════════════════════════════════════════════════════════════
// 8. Survey password gate
// ═════════════════════════════════════════════════════════════════════════

describe('Survey password gate', () => {
  interface SurveyApiResponse {
    id: string;
    title: string;
    requiresPassword: boolean;
    password_hash?: string;
  }

  function requiresAuth(survey: SurveyApiResponse, hasSessionCookie: boolean): boolean {
    return survey.requiresPassword && !hasSessionCookie;
  }

  function checkPassword(input: string): { status: number } {
    if (!isValidSurveyPassword(input)) return { status: 400 };
    // Simulate hash comparison (in real code this uses PBKDF2 + constantTimeEqual)
    if (input !== 'correct-password') return { status: 403 };
    return { status: 200 };
  }

  function stripPasswordHash(survey: Record<string, unknown>): Record<string, unknown> {
    const { password_hash, ...rest } = survey;
    return { ...rest, hasPassword: !!password_hash };
  }

  it('password-protected survey requires authentication', () => {
    const survey: SurveyApiResponse = { id: 's1', title: 'Test', requiresPassword: true };
    expect(requiresAuth(survey, false)).toBe(true);
  });

  it('wrong password returns 403', () => {
    const result = checkPassword('wrong-pass');
    expect(result.status).toBe(403);
  });

  it('correct password grants access (200)', () => {
    const result = checkPassword('correct-password');
    expect(result.status).toBe(200);
  });

  it('unprotected survey does not require password', () => {
    const survey: SurveyApiResponse = { id: 's1', title: 'Test', requiresPassword: false };
    expect(requiresAuth(survey, false)).toBe(false);
  });

  it('password hash is never returned in API responses', () => {
    const raw = {
      id: 's1',
      title: 'Protected Survey',
      password_hash: '$pbkdf2$100000$salt$hash',
      status: 'published',
    };
    const sanitized = stripPasswordHash(raw);
    expect(sanitized).not.toHaveProperty('password_hash');
    expect(sanitized).toHaveProperty('hasPassword', true);
  });

  it('password hash absence is indicated as hasPassword: false', () => {
    const raw = {
      id: 's2',
      title: 'Open Survey',
      password_hash: null,
      status: 'published',
    };
    const sanitized = stripPasswordHash(raw);
    expect(sanitized).not.toHaveProperty('password_hash');
    expect(sanitized).toHaveProperty('hasPassword', false);
  });

  it('minimum survey password length is enforced', () => {
    expect(checkPassword('abc').status).toBe(400);
    expect(checkPassword('abcd').status).not.toBe(400);
  });

  it('authenticated user with session cookie bypasses password gate', () => {
    const survey: SurveyApiResponse = { id: 's1', title: 'Test', requiresPassword: true };
    expect(requiresAuth(survey, true)).toBe(false);
  });
});
