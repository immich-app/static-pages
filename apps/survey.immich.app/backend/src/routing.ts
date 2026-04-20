/**
 * Shared URL patterns for the API worker ↔ DO routing layer.
 *
 * The worker matches these to decide whether to forward to a SurveyDO;
 * the DO's internal router strips the same prefixes to dispatch to its
 * HTTP handlers. Keeping the two in one module prevents drift.
 */

/** /api/surveys/:surveyId(/...)? */
export const SURVEY_ID_PATTERN = /^\/api\/surveys\/([^/]+)(\/.*)?$/;

/** /api/s/:slug(/...)? */
export const PUBLIC_PATTERN = /^\/api\/s\/([^/]+)(\/.*)?$/;
