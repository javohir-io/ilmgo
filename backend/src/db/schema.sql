-- Ilmgo schema. Idempotent: safe to run on a fresh database and on a
-- database created by an earlier release (ALTER ... ADD COLUMN IF NOT EXISTS).
-- Legacy columns (jobs.tags, jobs.logo_asset) are kept but unused.

-- ---------------------------------------------------------------- users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  university TEXT NOT NULL DEFAULT '',
  degree_program TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT 'Student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student'
  CHECK (role IN ('student', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT NOT NULL DEFAULT '';

-- ----------------------------------------------------------------- jobs
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  logo_asset TEXT NOT NULL DEFAULT 'default',
  tags TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT '{}',
  company_about TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Internship'
  CHECK (type IN ('Internship', 'Part-time', 'Full-time', 'Co-op'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT 'On-site'
  CHECK (work_mode IN ('Remote', 'Hybrid', 'On-site'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'Entry'
  CHECK (level IN ('Entry', 'Junior', 'Mid'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stipend TEXT NOT NULL DEFAULT '';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open', 'closed'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS accent TEXT NOT NULL DEFAULT '#00638E';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT[] NOT NULL DEFAULT '{}';

-- ------------------------------------------------------------ saved_jobs
CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);

-- ---------------------------------------------------------- applications
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  university TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  resume_file_name TEXT NOT NULL,
  resume_original_name TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'submitted'
  CHECK (status IN ('submitted', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn'));
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_note TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- One application per student per job. Rows created by the first release could
-- contain duplicates; keep the oldest of each pair so the unique index can be built.
DELETE FROM applications a
  USING applications b
  WHERE a.user_id = b.user_id AND a.job_id = b.job_id
    AND (a.created_at, a.id) > (b.created_at, b.id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_user_job ON applications (user_id, job_id);

CREATE TABLE IF NOT EXISTS application_events (
  id BIGSERIAL PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill a "submitted" event for applications that pre-date the timeline.
INSERT INTO application_events (application_id, status, note, created_at)
SELECT a.id, 'submitted', '', a.created_at
  FROM applications a
 WHERE NOT EXISTS (SELECT 1 FROM application_events e WHERE e.application_id = a.id);

-- ------------------------------------------------------------ interviews
-- The first release stored interviews.date as TIMESTAMPTZ plus a free-form
-- time_slot. If that shape is found, set the old table aside as
-- interviews_legacy (data kept, no longer used) and create the new one below.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema()
                AND table_name = 'interviews' AND column_name = 'time_slot') THEN
    ALTER TABLE interviews RENAME TO interviews_legacy;
    ALTER TABLE interviews_legacy RENAME CONSTRAINT interviews_pkey TO interviews_legacy_pkey;
    DROP INDEX IF EXISTS idx_interviews_user;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  application_id TEXT REFERENCES applications(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL CHECK (time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  duration_min INTEGER NOT NULL DEFAULT 30,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A slot of a job can be held by one scheduled interview; a student cannot be
-- in two places at once. Cancelled/completed rows free the slot.
CREATE UNIQUE INDEX IF NOT EXISTS uq_interviews_job_slot
  ON interviews (job_id, date, time) WHERE status = 'scheduled';
CREATE UNIQUE INDEX IF NOT EXISTS uq_interviews_user_slot
  ON interviews (user_id, date, time) WHERE status = 'scheduled';

-- --------------------------------------------------------- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN
    ('application_status', 'interview_booked', 'interview_cancelled', 'welcome', 'job_match')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link_kind TEXT CHECK (link_kind IN ('application', 'interview', 'job')),
  link_id TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------- indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications (created_at);
CREATE INDEX IF NOT EXISTS idx_app_events_application ON application_events (application_id, created_at);
CREATE INDEX IF NOT EXISTS idx_interviews_user ON interviews (user_id, date, time);
CREATE INDEX IF NOT EXISTS idx_interviews_job_date ON interviews (job_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id) WHERE read_at IS NULL;

-- Ilmgo palette: map accents from the earlier Ilmgo palette (idempotent).
UPDATE jobs SET accent = CASE accent
  WHEN '#7C5CFF' THEN '#00638E' WHEN '#22D3EE' THEN '#8CB9CC' WHEN '#FF5CAA' THEN '#004A6B'
  WHEN '#A3E635' THEN '#BFD8E3' WHEN '#FBBF24' THEN '#8CB9CC' WHEN '#FF5C6C' THEN '#004A6B' ELSE accent END
WHERE accent IN ('#7C5CFF','#22D3EE','#FF5CAA','#A3E635','#FBBF24','#FF5C6C');
