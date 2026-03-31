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
