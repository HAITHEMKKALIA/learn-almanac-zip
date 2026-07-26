-- Allow teachers to view profiles of students in their classes
CREATE OR REPLACE FUNCTION public.teacher_can_view_student(_teacher uuid, _student uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE c.teacher_id = _teacher AND cm.student_id = _student
  )
$$;

CREATE POLICY "Teachers view profiles of their students"
ON public.profiles FOR SELECT
USING (public.teacher_can_view_student(auth.uid(), user_id));

-- Also let teachers see class_members rows for any class they own (already covered) and
-- let teachers see roles of their students for context (optional, restricted)
CREATE POLICY "Teachers view roles of their students"
ON public.user_roles FOR SELECT
USING (public.teacher_can_view_student(auth.uid(), user_id));