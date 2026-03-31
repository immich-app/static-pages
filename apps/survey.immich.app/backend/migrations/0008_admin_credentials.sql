CREATE TABLE admin_credentials (
  id TEXT PRIMARY KEY DEFAULT 'default',
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
