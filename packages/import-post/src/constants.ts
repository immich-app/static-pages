// Outline links to attachments (videos) via this redirect path.
export const ATTACHMENT_PREFIX = '/api/attachments.redirect';

// Matches a date-only string (e.g. `2026-03-02`) so it can be emitted unquoted.
export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Mixed into the content hash, so a change here invalidates the bucket.
export const PIPELINE_VERSION = 'v5';

// An open import PR references its uploads only on its branch, so recent objects are never stale.
export const CLEANUP_GRACE_DAYS = 30;
