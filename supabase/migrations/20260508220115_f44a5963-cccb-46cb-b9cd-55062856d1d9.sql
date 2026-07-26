
-- 1) Detailed per-answer grading status
DO $$ BEGIN
  CREATE TYPE public.grading_status AS ENUM ('pending','ai_running','ai_failed','ai_graded','manual_graded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.submission_answers
  ADD COLUMN IF NOT EXISTS grading_status public.grading_status NOT NULL DEFAULT 'pending';

-- Backfill existing rows
UPDATE public.submission_answers
   SET grading_status = CASE
     WHEN ai_graded = true AND awarded_points IS NOT NULL THEN 'ai_graded'::public.grading_status
     WHEN awarded_points IS NOT NULL THEN 'manual_graded'::public.grading_status
     ELSE 'pending'::public.grading_status
   END
 WHERE grading_status = 'pending';

-- 2) Audit log of grading events
CREATE TABLE IF NOT EXISTS public.grading_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  question_id uuid,
  actor_id uuid NOT NULL,
  actor_role text NOT NULL DEFAULT 'teacher',
  kind text NOT NULL, -- 'ai_attempt_start' | 'ai_attempt_success' | 'ai_attempt_failure' | 'manual_save' | 'reset_pending'
  awarded_points numeric,
  teacher_comment text,
  is_correct boolean,
  message text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grading_events_sub_idx ON public.grading_events(submission_id, created_at DESC);

ALTER TABLE public.grading_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher view grading events"
ON public.grading_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.submissions s
  JOIN public.assignments a ON a.id = s.assignment_id
  WHERE s.id = grading_events.submission_id AND a.teacher_id = auth.uid()
));

CREATE POLICY "Actor insert own grading events"
ON public.grading_events FOR INSERT
WITH CHECK (auth.uid() = actor_id);
