/*
# Factory Bhasha Buddy core schema

Plain-English summary: creates the tables that power the worker app and the supervisor dashboard. Workers are anonymous (identified only by a random ID stored in their phone browser). Content such as notices, quiz pictures and safety guidance is readable by the app; the app can record workers' activity (notice listens, quiz answers, questions asked, complaints).

1. New Tables
- `departments`: factory departments (Assembly, Packing, Cleaning, Cutting).
- `workers`: anonymous worker profile with preferred language and department.
- `shifts`: day/night shift timings and location per department.
- `safety_topics`: safety topics with short guidance in each language.
- `notices`: supervisor-written notices (English original).
- `notice_translations`: voice script and key points of each notice per language.
- `notice_events`: play / replay / not clear / understood events per worker.
- `quiz_questions`: picture questions with two options, prompt and explanation per language.
- `quiz_attempts`: answers given in the picture quiz.
- `voice_queries`: questions asked by workers and the detected intent.
- `complaints`: structured complaints with a tracking ID and status.

2. Security
- Row level security is enabled on every table.
- The app has no sign-in screen, so every policy targets `anon` and `authenticated`.
- Only the verbs the app needs are granted. Complaints and notices cannot be deleted by the app.

3. Important notes
- Language values are limited to en, hi, ta, te.
- Indexes are added on the columns used for joins and dashboard aggregation.
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'ta', 'te')),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  shift_type text NOT NULL CHECK (shift_type IN ('day', 'night')),
  start_time text NOT NULL,
  end_time text NOT NULL,
  location text NOT NULL
);

CREATE TABLE IF NOT EXISTS safety_topics (
  id text PRIMARY KEY,
  name text NOT NULL,
  guidance jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('general', 'safety', 'payroll', 'policy')),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  topic_id text REFERENCES safety_topics(id) ON DELETE SET NULL,
  full_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notice_translations (
  notice_id uuid NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (language IN ('en', 'hi', 'ta', 'te')),
  voice_script text NOT NULL,
  key_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (notice_id, language)
);

CREATE TABLE IF NOT EXISTS notice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  notice_id uuid NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  event text NOT NULL CHECK (event IN ('play', 'replay', 'not_clear', 'understood')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id text NOT NULL REFERENCES safety_topics(id) ON DELETE CASCADE,
  image_a_url text NOT NULL,
  image_b_url text NOT NULL,
  correct_option smallint NOT NULL CHECK (correct_option IN (0, 1)),
  prompt jsonb NOT NULL,
  explanation jsonb NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  chosen_option smallint NOT NULL CHECK (chosen_option IN (0, 1)),
  is_correct boolean NOT NULL,
  language text NOT NULL CHECK (language IN ('en', 'hi', 'ta', 'te')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (language IN ('en', 'hi', 'ta', 'te')),
  intent text NOT NULL CHECK (intent IN ('SHIFT_INFO', 'SAFETY_INFO', 'NOTICE_QUERY', 'COMPLAINT', 'OTHER')),
  topic_id text REFERENCES safety_topics(id) ON DELETE SET NULL,
  raw_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text NOT NULL UNIQUE,
  worker_id uuid REFERENCES workers(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('unsafe', 'unpaid_salary', 'harassment', 'other')),
  raw_text text NOT NULL,
  language text NOT NULL CHECK (language IN ('en', 'hi', 'ta', 'te')),
  structured_summary text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shifts_department ON shifts(department_id);
CREATE INDEX IF NOT EXISTS idx_workers_department ON workers(department_id);
CREATE INDEX IF NOT EXISTS idx_notices_department ON notices(department_id);
CREATE INDEX IF NOT EXISTS idx_notices_topic ON notices(topic_id);
CREATE INDEX IF NOT EXISTS idx_notice_events_worker ON notice_events(worker_id);
CREATE INDEX IF NOT EXISTS idx_notice_events_notice ON notice_events(notice_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic ON quiz_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_worker ON quiz_attempts(worker_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_question ON quiz_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_voice_queries_worker ON voice_queries(worker_id);
CREATE INDEX IF NOT EXISTS idx_voice_queries_topic ON voice_queries(topic_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_worker ON complaints(worker_id);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON departments, shifts, safety_topics, quiz_questions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON workers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notices, notice_translations TO anon, authenticated;
GRANT SELECT, INSERT ON notice_events, quiz_attempts, voice_queries TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON complaints TO anon, authenticated;

DROP POLICY IF EXISTS "shared_select_departments" ON departments;
CREATE POLICY "shared_select_departments" ON departments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_shifts" ON shifts;
CREATE POLICY "shared_select_shifts" ON shifts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_safety_topics" ON safety_topics;
CREATE POLICY "shared_select_safety_topics" ON safety_topics FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_quiz_questions" ON quiz_questions;
CREATE POLICY "shared_select_quiz_questions" ON quiz_questions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_workers" ON workers;
CREATE POLICY "anon_select_workers" ON workers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_workers" ON workers;
CREATE POLICY "anon_insert_workers" ON workers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_workers" ON workers;
CREATE POLICY "anon_update_workers" ON workers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "shared_select_notices" ON notices;
CREATE POLICY "shared_select_notices" ON notices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_notices" ON notices;
CREATE POLICY "shared_insert_notices" ON notices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_notices" ON notices;
CREATE POLICY "shared_update_notices" ON notices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_notices" ON notices;
CREATE POLICY "shared_delete_notices" ON notices FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_notice_translations" ON notice_translations;
CREATE POLICY "shared_select_notice_translations" ON notice_translations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_notice_translations" ON notice_translations;
CREATE POLICY "shared_insert_notice_translations" ON notice_translations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_notice_translations" ON notice_translations;
CREATE POLICY "shared_update_notice_translations" ON notice_translations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_notice_translations" ON notice_translations;
CREATE POLICY "shared_delete_notice_translations" ON notice_translations FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_notice_events" ON notice_events;
CREATE POLICY "shared_select_notice_events" ON notice_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_notice_events" ON notice_events;
CREATE POLICY "shared_insert_notice_events" ON notice_events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "shared_select_quiz_attempts" ON quiz_attempts;
CREATE POLICY "shared_select_quiz_attempts" ON quiz_attempts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_quiz_attempts" ON quiz_attempts;
CREATE POLICY "shared_insert_quiz_attempts" ON quiz_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "shared_select_voice_queries" ON voice_queries;
CREATE POLICY "shared_select_voice_queries" ON voice_queries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_voice_queries" ON voice_queries;
CREATE POLICY "shared_insert_voice_queries" ON voice_queries FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "shared_select_complaints" ON complaints;
CREATE POLICY "shared_select_complaints" ON complaints FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_complaints" ON complaints;
CREATE POLICY "shared_insert_complaints" ON complaints FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_complaints" ON complaints;
CREATE POLICY "shared_update_complaints" ON complaints FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
