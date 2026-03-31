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

export const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours
export const SESSION_COOKIE_NAME = 'survey_session';
export const AUTH_STATE_COOKIE_NAME = 'auth_state';
export type UserRole = 'admin' | 'editor' | 'viewer';
