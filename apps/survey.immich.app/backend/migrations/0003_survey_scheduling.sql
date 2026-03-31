ALTER TABLE surveys ADD COLUMN closes_at TEXT;
ALTER TABLE surveys ADD COLUMN max_responses INTEGER;
ALTER TABLE surveys ADD COLUMN randomize_questions INTEGER DEFAULT 0;
ALTER TABLE surveys ADD COLUMN randomize_options INTEGER DEFAULT 0;
