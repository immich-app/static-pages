-- surveys
CREATE TABLE surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
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

CREATE UNIQUE INDEX idx_surveys_slug ON surveys(slug);

-- survey sections
CREATE TABLE survey_sections (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

CREATE INDEX idx_sections_survey ON survey_sections(survey_id);

-- survey questions
CREATE TABLE survey_questions (
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
  config TEXT,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES survey_sections(id) ON DELETE CASCADE
);

CREATE INDEX idx_questions_survey ON survey_questions(survey_id);
CREATE INDEX idx_questions_section ON survey_questions(section_id);

-- respondents
CREATE TABLE respondents (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  ip_address TEXT,
  is_complete INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);

CREATE INDEX idx_respondents_survey ON respondents(survey_id);

-- answers
CREATE TABLE answers (
  respondent_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  other_text TEXT,
  answered_at TEXT NOT NULL,
  PRIMARY KEY (respondent_id, question_id),
  FOREIGN KEY (respondent_id) REFERENCES respondents(id)
);

-- audit log
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_sub TEXT NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_audit_log_user ON audit_log(user_sub);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- tags
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE survey_tags (
  survey_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (survey_id, tag_id),
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_survey_tags_survey ON survey_tags(survey_id);
CREATE INDEX idx_survey_tags_tag ON survey_tags(tag_id);

-- admin credentials
CREATE TABLE admin_credentials (
  id TEXT PRIMARY KEY DEFAULT 'default',
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
