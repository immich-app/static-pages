export const VALID_QUESTION_TYPES = [
  'radio',
  'checkbox',
  'text',
  'textarea',
  'email',
  'rating',
  'nps',
  'number',
  'dropdown',
  'likert',
];

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

export const BATCH_ANSWER_LIMIT = 20;

export const ACTIVE_RESPONDENT_WINDOW_MS = 5 * 60 * 1000;

export const SEARCH_RESULT_LIMIT = 100;

export const MAX_PAGINATION_LIMIT = 100;

export const PASSWORD_SESSION_MAX_AGE = 86400; // 24 hours
export const PBKDF2_ITERATIONS = 100_000;

export const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours
export const SESSION_COOKIE_NAME = 'survey_session';
export const AUTH_STATE_COOKIE_NAME = 'auth_state';
export type UserRole = 'admin' | 'editor' | 'viewer';
export const ROLE_HIERARCHY: Record<string, number> = { admin: 3, editor: 2, viewer: 1, public: 0 };

/**
 * Maximum client-reported milliseconds spent on a single question before we
 * treat the value as garbage. 24 hours — anything longer is either the user
 * leaving the tab open overnight or a broken clock.
 */
export const MAX_ANSWER_MS = 24 * 60 * 60 * 1000;

/**
 * Clamp a client-supplied per-question duration to the valid range. Returns
 * null for missing/non-finite/negative values so the caller can persist NULL
 * instead of a poisoned aggregate input.
 */
export function clampAnswerMs(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return null;
  return Math.min(Math.floor(raw), MAX_ANSWER_MS);
}

/**
 * Fast-tier broadcast interval (presence, counters, in-memory choice results).
 * Slow-tier fires every SLOW_TICKS_PER_CYCLE × fast ticks and runs the
 * SQL-backed analytics queries.
 */
export const BROADCAST_FAST_INTERVAL_MS = 5000;
export const BROADCAST_SLOW_TICKS_PER_CYCLE = 12; // 12 × 5s = 60s

/**
 * Fixed completion-time histogram buckets. Used by the completion-time chart
 * and shared between the service query and any test fixtures.
 */
export const COMPLETION_TIME_BUCKETS: ReadonlyArray<{
  label: string;
  minSeconds: number;
  maxSeconds: number | null;
}> = [
  { label: '<30s', minSeconds: 0, maxSeconds: 30 },
  { label: '30s–1m', minSeconds: 30, maxSeconds: 60 },
  { label: '1–2m', minSeconds: 60, maxSeconds: 120 },
  { label: '2–5m', minSeconds: 120, maxSeconds: 300 },
  { label: '5–10m', minSeconds: 300, maxSeconds: 600 },
  { label: '10–30m', minSeconds: 600, maxSeconds: 1800 },
  { label: '30m–1h', minSeconds: 1800, maxSeconds: 3600 },
  { label: '>1h', minSeconds: 3600, maxSeconds: null },
];

/**
 * Nearest-rank percentile on a sorted ascending array. Returns null for empty
 * input. Used by timing analytics.
 */
export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}
