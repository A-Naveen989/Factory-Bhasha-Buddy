
BEGIN;

-- =====================================================
-- 1. TRUSTED SUPERVISOR ROLE CHECK
-- app_metadata is controlled by administrators.
-- A worker cannot grant themselves this role.
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
      false
    )
    AND
    NOT COALESCE(
      (auth.jwt() ->> 'is_anonymous')::boolean,
      false
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin()
TO authenticated;


-- =====================================================
-- 2. ENSURE RLS IS ENABLED
-- =====================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- 3. REMOVE OLD PERMISSIVE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "shared_select_departments"
ON public.departments;

DROP POLICY IF EXISTS "shared_select_shifts"
ON public.shifts;

DROP POLICY IF EXISTS "shared_select_safety_topics"
ON public.safety_topics;

DROP POLICY IF EXISTS "shared_select_quiz_questions"
ON public.quiz_questions;

DROP POLICY IF EXISTS "anon_select_workers"
ON public.workers;

DROP POLICY IF EXISTS "anon_insert_workers"
ON public.workers;

DROP POLICY IF EXISTS "anon_update_workers"
ON public.workers;

DROP POLICY IF EXISTS "shared_select_notices"
ON public.notices;

DROP POLICY IF EXISTS "shared_insert_notices"
ON public.notices;

DROP POLICY IF EXISTS "shared_update_notices"
ON public.notices;

DROP POLICY IF EXISTS "shared_delete_notices"
ON public.notices;

DROP POLICY IF EXISTS "shared_select_notice_translations"
ON public.notice_translations;

DROP POLICY IF EXISTS "shared_insert_notice_translations"
ON public.notice_translations;

DROP POLICY IF EXISTS "shared_update_notice_translations"
ON public.notice_translations;

DROP POLICY IF EXISTS "shared_delete_notice_translations"
ON public.notice_translations;

DROP POLICY IF EXISTS "shared_select_notice_events"
ON public.notice_events;

DROP POLICY IF EXISTS "shared_insert_notice_events"
ON public.notice_events;

DROP POLICY IF EXISTS "shared_select_quiz_attempts"
ON public.quiz_attempts;

DROP POLICY IF EXISTS "shared_insert_quiz_attempts"
ON public.quiz_attempts;

DROP POLICY IF EXISTS "shared_select_voice_queries"
ON public.voice_queries;

DROP POLICY IF EXISTS "shared_insert_voice_queries"
ON public.voice_queries;

DROP POLICY IF EXISTS "shared_select_complaints"
ON public.complaints;

DROP POLICY IF EXISTS "shared_insert_complaints"
ON public.complaints;

DROP POLICY IF EXISTS "shared_update_complaints"
ON public.complaints;


-- =====================================================
-- 4. RESET TABLE PERMISSIONS
-- =====================================================

REVOKE ALL ON TABLE
  public.departments,
  public.workers,
  public.shifts,
  public.safety_topics,
  public.notices,
  public.notice_translations,
  public.notice_events,
  public.quiz_questions,
  public.quiz_attempts,
  public.voice_queries,
  public.complaints
FROM anon, authenticated;


-- =====================================================
-- 5. REFERENCE DATA
-- Authenticated workers and supervisors can read these.
-- =====================================================

GRANT SELECT ON
  public.departments,
  public.shifts,
  public.safety_topics,
  public.notices,
  public.notice_translations,
  public.quiz_questions
TO authenticated;


-- =====================================================
-- 6. WORKER PROFILES
-- Workers can only modify their own profile.
-- Their worker ID must equal auth.uid().
-- =====================================================

GRANT SELECT ON public.workers TO authenticated;

GRANT INSERT (id)
ON public.workers
TO authenticated;

GRANT UPDATE (language, department_id)
ON public.workers
TO authenticated;


CREATE POLICY workers_read_self
ON public.workers
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  AND COALESCE(
    ((SELECT auth.jwt()) ->> 'is_anonymous')::boolean,
    false
  )
);

CREATE POLICY workers_create_self
ON public.workers
FOR INSERT
TO authenticated
WITH CHECK (
  id = (SELECT auth.uid())
  AND COALESCE(
    ((SELECT auth.jwt()) ->> 'is_anonymous')::boolean,
    false
  )
);

CREATE POLICY workers_update_self
ON public.workers
FOR UPDATE
TO authenticated
USING (
  id = (SELECT auth.uid())
  AND COALESCE(
    ((SELECT auth.jwt()) ->> 'is_anonymous')::boolean,
    false
  )
)
WITH CHECK (
  id = (SELECT auth.uid())
  AND COALESCE(
    ((SELECT auth.jwt()) ->> 'is_anonymous')::boolean,
    false
  )
);

CREATE POLICY workers_admin_read
ON public.workers
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));


-- =====================================================
-- 7. NOTICES
-- Everyone authenticated can read.
-- Only supervisors can create and update.
-- =====================================================

GRANT INSERT, UPDATE ON
  public.notices,
  public.notice_translations
TO authenticated;


CREATE POLICY notices_read
ON public.notices
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY notices_admin_insert
ON public.notices
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY notices_admin_update
ON public.notices
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));


CREATE POLICY translations_read
ON public.notice_translations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY translations_admin_insert
ON public.notice_translations
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY translations_admin_update
ON public.notice_translations
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));


-- =====================================================
-- 8. NOTICE EVENTS
-- Workers can record and read their own activity.
-- Supervisors can read all activity.
-- =====================================================

GRANT SELECT ON public.notice_events TO authenticated;

GRANT INSERT (worker_id, notice_id, event)
ON public.notice_events
TO authenticated;


CREATE POLICY notice_events_read_self
ON public.notice_events
FOR SELECT
TO authenticated
USING (worker_id = (SELECT auth.uid()));

CREATE POLICY notice_events_insert_self
ON public.notice_events
FOR INSERT
TO authenticated
WITH CHECK (
  worker_id = (SELECT auth.uid())
  AND COALESCE(
    ((SELECT auth.jwt()) ->> 'is_anonymous')::boolean,
    false
  )
);

CREATE POLICY notice_events_admin_read
ON public.notice_events
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));


-- =====================================================
-- 9. QUIZ ATTEMPTS
-- Workers can submit their own attempts and read their
-- own results. Supervisors can read all results.
-- =====================================================

GRANT SELECT ON public.quiz_attempts TO authenticated;

GRANT INSERT (
  worker_id,
  question_id,
  chosen_option,
  is_correct,
  language
)
ON public.quiz_attempts
TO authenticated;


CREATE POLICY quiz_attempts_read_self
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (worker_id = (SELECT auth.uid()));

CREATE POLICY quiz_attempts_insert_self
ON public.quiz_attempts
FOR INSERT
TO authenticated
WITH CHECK (
  worker_id = (SELECT auth.uid())
  AND COALESCE(
    ((SELECT auth.jwt()) ->> 'is_anonymous')::boolean,
    false
  )
);

CREATE POLICY quiz_attempts_admin_read
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));


-- =====================================================
-- 10. VOICE QUERIES
-- Workers can submit their own questions.
-- Only supervisors can read query history.
-- =====================================================

GRANT SELECT ON public.voice_queries TO authenticated;

GRANT INSERT (
  worker_id,
  language,
  intent,
  topic_id,
  raw_text
)
ON public.voice_queries
TO authenticated;


CREATE POLICY voice_queries_insert_self
ON public.voice_queries
FOR INSERT
TO authenticated
WITH CHECK (
  worker_id = (SELECT auth.uid())
  AND COALESCE(
    ((SELECT auth.jwt()) ->> 'is_anonymous')::boolean,
    false
  )
);

CREATE POLICY voice_queries_admin_read
ON public.voice_queries
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));


-- =====================================================
-- 11. COMPLAINTS
-- Workers can submit and read their own complaints.
-- Only supervisors can see all complaints or update status.
-- =====================================================

GRANT SELECT ON public.complaints TO authenticated;

GRANT INSERT (
  tracking_id,
  worker_id,
  category,
  raw_text,
  language,
  structured_summary,
  department_id
)
ON public.complaints
TO authenticated;

GRANT UPDATE (status)
ON public.complaints
TO authenticated;


CREATE POLICY complaints_insert_self
ON public.complaints
FOR INSERT
TO authenticated
WITH CHECK (
  worker_id = (SELECT auth.uid())
  AND COALESCE(
    ((SELECT auth.jwt()) ->> 'is_anonymous')::boolean,
    false
  )
);

CREATE POLICY complaints_read_self
ON public.complaints
FOR SELECT
TO authenticated
USING (worker_id = (SELECT auth.uid()));

CREATE POLICY complaints_admin_read
ON public.complaints
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY complaints_admin_update
ON public.complaints
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));


COMMIT;
