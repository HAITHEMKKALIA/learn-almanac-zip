
-- 1) quote_requests INSERT — replace WITH CHECK (true) with basic validation
DROP POLICY IF EXISTS "Anyone can request a quote" ON public.quote_requests;
CREATE POLICY "Anyone can request a quote"
  ON public.quote_requests
  FOR INSERT
  WITH CHECK (
    status = 'new'
    AND internal_notes IS NULL
    AND length(btrim(contact_name)) BETWEEN 1 AND 200
    AND length(btrim(email)) BETWEEN 3 AND 200
    AND length(btrim(plan)) BETWEEN 1 AND 100
    AND (message IS NULL OR length(message) <= 5000)
  );

-- 2) storage.objects — replace LIKE match with exact path equality
DROP POLICY IF EXISTS "Chat recipients can read attachments" ON storage.objects;
CREATE POLICY "Chat recipients can read attachments"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.direct_messages dm
      WHERE dm.recipient_id = auth.uid()
        AND dm.attachment_url = storage.objects.name
    )
  );

-- 3) Teacher grade policies — add WITH CHECK mirroring USING
DROP POLICY IF EXISTS "Teacher grade submissions" ON public.submissions;
CREATE POLICY "Teacher grade submissions"
  ON public.submissions
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = submissions.assignment_id AND a.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = submissions.assignment_id AND a.teacher_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Teacher grade answers" ON public.submission_answers;
CREATE POLICY "Teacher grade answers"
  ON public.submission_answers
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = submission_answers.submission_id AND a.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = submission_answers.submission_id AND a.teacher_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Teacher grade submissions" ON public.homework_submissions;
CREATE POLICY "Teacher grade submissions"
  ON public.homework_submissions
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_submissions.homework_id AND h.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_submissions.homework_id AND h.teacher_id = auth.uid()
  ));
