-- Per-question timing: how long (in milliseconds) a respondent spent on
-- each question between it becoming visible and them committing the answer.
-- Nullable so existing rows don't need backfilling.
ALTER TABLE answers ADD COLUMN answer_ms INTEGER;
