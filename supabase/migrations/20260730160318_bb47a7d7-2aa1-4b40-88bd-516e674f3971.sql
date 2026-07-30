-- Broaden visibility of homework submissions to co-teachers, class teachers and school admins
DROP POLICY IF EXISTS "Teacher view class submissions" ON public.homework_submissions;
CREATE POLICY "Staff view class submissions"
ON public.homework_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.classes c ON c.id = h.class_id
    WHERE h.id = homework_submissions.homework_id
      AND (
        h.teacher_id = auth.uid()
        OR public.is_class_teacher_any(c.id, auth.uid())
        OR public.is_school_owner(c.school_id, auth.uid())
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

DROP POLICY IF EXISTS "Teacher grade submissions" ON public.homework_submissions;
CREATE POLICY "Staff grade submissions"
ON public.homework_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.classes c ON c.id = h.class_id
    WHERE h.id = homework_submissions.homework_id
      AND (
        h.teacher_id = auth.uid()
        OR public.is_class_teacher_any(c.id, auth.uid())
        OR public.is_school_owner(c.school_id, auth.uid())
        OR public.has_role(auth.uid(), 'admin')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.classes c ON c.id = h.class_id
    WHERE h.id = homework_submissions.homework_id
      AND (
        h.teacher_id = auth.uid()
        OR public.is_class_teacher_any(c.id, auth.uid())
        OR public.is_school_owner(c.school_id, auth.uid())
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

-- Students may clean up their own draft answers before re-submitting
DROP POLICY IF EXISTS "hqa_student_delete_own" ON public.homework_question_answers;
CREATE POLICY "hqa_student_delete_own"
ON public.homework_question_answers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.homework_submissions s
    WHERE s.id = homework_question_answers.submission_id
      AND s.student_id = auth.uid()
      AND s.status IN ('draft','submitted')
  )
);
