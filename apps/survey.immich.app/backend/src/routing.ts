/**
 * Shared by the worker's DO-forwarding check and the DO's own router, which
 * strips the same prefixes — one module so the two can't drift.
 */

/** /api/surveys/:surveyId(/...)? */
export const SURVEY_ID_PATTERN = /^\/api\/surveys\/([^/]+)(\/.*)?$/;

/** /api/s/:slug(/...)? */
export const PUBLIC_PATTERN = /^\/api\/s\/([^/]+)(\/.*)?$/;
