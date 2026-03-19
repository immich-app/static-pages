-- migrations/0002_cookie_dedup.sql
-- Switch from IP-based to cookie-based deduplication.
-- IP column stays for analytics but is no longer a uniqueness constraint.
-- Add other_text column for "Other" free-text responses on Q7, Q13-Q16.

DROP INDEX IF EXISTS idx_respondents_ip;

ALTER TABLE answers ADD COLUMN other_text TEXT;
