/**
Table names must match the main Database interface so the shared Kysely queries work unchanged.
*/

const SCHEMA = `
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  welcome_title TEXT,
  welcome_description TEXT,
  thank_you_title TEXT,
  thank_you_description TEXT,
  closes_at TEXT,
  max_responses INTEGER,
  randomize_questions INTEGER DEFAULT 0,
  randomize_options INTEGER DEFAULT 0,
  password_hash TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_sections (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_do_sections_survey ON survey_sections(survey_id);

CREATE TABLE IF NOT EXISTS survey_questions (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  text TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  options TEXT,
  required INTEGER NOT NULL DEFAULT 1,
  has_other INTEGER NOT NULL DEFAULT 0,
  other_prompt TEXT,
  max_length INTEGER,
  placeholder TEXT,
  sort_order INTEGER NOT NULL,
  conditional TEXT,
  config TEXT
);

CREATE INDEX IF NOT EXISTS idx_do_questions_survey ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_do_questions_section ON survey_questions(section_id);

CREATE TABLE IF NOT EXISTS respondents (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  ip_address TEXT,
  is_complete INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_do_respondents_survey ON respondents(survey_id);

CREATE TABLE IF NOT EXISTS answers (
  respondent_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  other_text TEXT,
  answered_at TEXT NOT NULL,
  answer_ms INTEGER,
  PRIMARY KEY (respondent_id, question_id)
);
`;

const initializedInstances = new WeakSet<SqlStorage>();

/**
Additive migrations, replayed on every boot — there is no version table, so each must be safe to re-run.
*/
const MIGRATIONS: string[] = ['ALTER TABLE answers ADD COLUMN answer_ms INTEGER'];

function isAlreadyAppliedError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message.toLowerCase() : '';
  return msg.includes('duplicate column') || msg.includes('already exists');
}

function applySchema(sql: SqlStorage): void {
  sql.exec(SCHEMA);
  for (const stmt of MIGRATIONS) {
    try {
      sql.exec(stmt);
    } catch (error) {
      if (!isAlreadyAppliedError(error)) {throw error;}
    }
  }
}

export function ensureSchema(sql: SqlStorage): void {
  if (initializedInstances.has(sql)) {return;}
  applySchema(sql);
  initializedInstances.add(sql);
}

export function recreateSchemaAfterWipe(sql: SqlStorage): void {
  applySchema(sql);
}
