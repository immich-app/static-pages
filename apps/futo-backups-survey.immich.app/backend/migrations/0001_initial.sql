-- migrations/0001_initial.sql
-- Initial schema: respondents and answers tables for survey persistence

CREATE TABLE respondents (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL,
  is_complete INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE UNIQUE INDEX idx_respondents_ip ON respondents(ip_address);

CREATE TABLE answers (
  respondent_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  answered_at TEXT NOT NULL,
  PRIMARY KEY (respondent_id, question_id),
  FOREIGN KEY (respondent_id) REFERENCES respondents(id)
);
