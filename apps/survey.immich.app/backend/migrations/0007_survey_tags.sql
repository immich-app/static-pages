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
