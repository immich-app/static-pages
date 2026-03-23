-- migrations/0003_turnstile_verified.sql
-- Track whether the respondent passed a Cloudflare Turnstile challenge.
-- Existing respondents default to unverified (0).

ALTER TABLE respondents ADD COLUMN is_verified INTEGER DEFAULT 0;
