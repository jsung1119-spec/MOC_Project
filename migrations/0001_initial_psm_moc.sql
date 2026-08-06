CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  login_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS moc_cases (
  id TEXT PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  work_type TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id),
  department TEXT NOT NULL,
  is_moc_target BOOLEAN,
  grade TEXT,
  risk_level TEXT,
  status TEXT NOT NULL,
  planned_start_date DATE,
  planned_end_date DATE,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS moc_answers (
  id TEXT PRIMARY KEY,
  moc_case_id TEXT NOT NULL REFERENCES moc_cases(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (moc_case_id, question_id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS moc_judgments (
  id TEXT PRIMARY KEY,
  moc_case_id TEXT NOT NULL UNIQUE REFERENCES moc_cases(id) ON DELETE CASCADE,
  is_moc_target BOOLEAN NOT NULL,
  grade TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  summary TEXT NOT NULL,
  requires_human_review BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS moc_evidences (
  id TEXT PRIMARY KEY,
  judgment_id TEXT NOT NULL REFERENCES moc_judgments(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  guideline_section TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS required_documents (
  id TEXT PRIMARY KEY,
  moc_case_id TEXT NOT NULL REFERENCES moc_cases(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  required BOOLEAN NOT NULL,
  status TEXT NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS status_histories (
  id TEXT PRIMARY KEY,
  moc_case_id TEXT NOT NULL REFERENCES moc_cases(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  moc_case_id TEXT NOT NULL REFERENCES moc_cases(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  message TEXT NOT NULL,
  UNIQUE (moc_case_id, reminder_type, scheduled_at)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS guidelines (
  id TEXT PRIMARY KEY,
  section_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS decision_rules (
  id TEXT PRIMARY KEY,
  rule_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  condition_json JSONB NOT NULL,
  result_json JSONB NOT NULL,
  guideline_id TEXT REFERENCES guidelines(id),
  priority INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  description TEXT,
  answer_type TEXT NOT NULL,
  options_json JSONB NOT NULL,
  visible_when_json JSONB,
  guideline_section TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS moc_cases_author_status_idx ON moc_cases(author_id, status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS moc_cases_planned_end_date_idx ON moc_cases(planned_end_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS status_histories_case_idx ON status_histories(moc_case_id, created_at DESC);
