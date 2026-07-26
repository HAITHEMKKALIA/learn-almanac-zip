CREATE OR REPLACE FUNCTION public.student_can_view_teacher_presence(_student uuid, _teacher uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE cm.student_id = _student
      AND c.teacher_id = _teacher
  )
$$;

DROP POLICY IF EXISTS "Students view class teacher presence" ON public.user_presence;

CREATE POLICY "Students view class teacher presence"
ON public.user_presence
FOR SELECT
TO authenticated
USING (public.student_can_view_teacher_presence(auth.uid(), user_id));