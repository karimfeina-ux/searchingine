-- Cloudflare D1 Database Schema for LeadHunter AI
-- Native serverless SQLite on Cloudflare Free Plan

CREATE TABLE IF NOT EXISTS prospects (
  id TEXT PRIMARY KEY,
  name TEXT,
  normalized_name TEXT,
  city TEXT,
  category TEXT,
  phone TEXT,
  status TEXT DEFAULT 'new',
  website_status TEXT,
  lead_score REAL DEFAULT 0,
  is_contacted INTEGER DEFAULT 0,
  is_clicked INTEGER DEFAULT 0,
  is_starred INTEGER DEFAULT 0,
  contacted_at TEXT,
  notes TEXT,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects (status);
CREATE INDEX IF NOT EXISTS idx_prospects_contacted ON prospects (is_contacted);
CREATE INDEX IF NOT EXISTS idx_prospects_updated ON prospects (updated_at);

CREATE TABLE IF NOT EXISTS exclusions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'name' or 'phone'
  value TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exclusions_type_val ON exclusions (type, value);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
