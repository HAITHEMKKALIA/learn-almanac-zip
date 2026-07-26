
DROP POLICY IF EXISTS "Student join class" ON public.class_members;

CREATE POLICY "Student join class if school member"
ON public.class_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.school_members sm ON sm.school_id = c.school_id
    WHERE c.id = class_members.class_id
      AND sm.user_id = auth.uid()
  )
);
