ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS released_at timestamp with time zone;
ALTER TABLE public.submission_answers ADD COLUMN IF NOT EXISTS ai_graded boolean NOT NULL DEFAULT false;
ALTER TABLE public.homework_submissions ADD COLUMN IF NOT EXISTS ai_graded boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Student read bank for released results" ON public.question_bank;
CREATE POLICY "Student read bank for released results"
ON public.question_bank
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.submission_answers sa
    JOIN public.submissions s ON s.id = sa.submission_id
    WHERE sa.question_id = question_bank.id
      AND s.student_id = auth.uid()
      AND s.released_at IS NOT NULL
  )
);