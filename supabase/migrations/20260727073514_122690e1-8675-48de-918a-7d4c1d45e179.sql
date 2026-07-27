
-- 1. forum_likes: authenticated-only read
DROP POLICY IF EXISTS "read likes" ON public.forum_likes;
CREATE POLICY "read likes" ON public.forum_likes
  FOR SELECT TO authenticated USING (true);

-- 2. grading_events: validate actor_role and teacher relationship
DROP POLICY IF EXISTS "Actor insert own grading events" ON public.grading_events;
CREATE POLICY "Actor insert own grading events" ON public.grading_events
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = actor_id
    AND (
      (actor_role = 'system' AND (public.has_role(auth.uid(),'admin') OR public.is_super_admin(auth.uid())))
      OR (actor_role = 'student' AND EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = grading_events.submission_id AND s.student_id = auth.uid()))
      OR (actor_role IN ('teacher','ai') AND (
            public.has_role(auth.uid(),'admin')
            OR public.is_super_admin(auth.uid())
            OR EXISTS (
              SELECT 1 FROM public.submissions s
              JOIN public.assignments a ON a.id = s.assignment_id
              WHERE s.id = grading_events.submission_id AND a.teacher_id = auth.uid())))
    )
  );

-- 3. homework_submissions: restrict student updates to non-grading fields
DROP POLICY IF EXISTS "Student update own submission" ON public.homework_submissions;
CREATE POLICY "Student update own submission" ON public.homework_submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (
    auth.uid() = student_id
    AND score IS NULL
    AND teacher_feedback IS NULL
    AND graded_at IS NULL
    AND COALESCE(ai_graded, false) = false
    AND status IN ('draft','submitted')
  );

-- 4. submission_answers: split student ALL into scoped INSERT/SELECT/UPDATE only
DROP POLICY IF EXISTS "Student own answers" ON public.submission_answers;
CREATE POLICY "Student select own answers" ON public.submission_answers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid()
  ));
CREATE POLICY "Student insert own answers" ON public.submission_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid()
    )
    AND awarded_points IS NULL
    AND is_correct IS NULL
    AND teacher_comment IS NULL
    AND COALESCE(ai_graded, false) = false
    AND grading_status = 'pending'::public.grading_status
  );
CREATE POLICY "Student update own answers" ON public.submission_answers
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid()
  ))
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_answers.submission_id AND s.student_id = auth.uid()
    )
    AND awarded_points IS NULL
    AND is_correct IS NULL
    AND teacher_comment IS NULL
    AND COALESCE(ai_graded, false) = false
    AND grading_status = 'pending'::public.grading_status
  );

-- 5. submissions: restrict student updates to non-grading fields
DROP POLICY IF EXISTS "Student update own submission" ON public.submissions;
CREATE POLICY "Student update own submission" ON public.submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (
    auth.uid() = student_id
    AND score IS NULL
    AND total IS NULL
    AND teacher_feedback IS NULL
    AND released_at IS NULL
    AND status IN ('not_started'::public.submission_status,'in_progress'::public.submission_status,'submitted'::public.submission_status)
  );
