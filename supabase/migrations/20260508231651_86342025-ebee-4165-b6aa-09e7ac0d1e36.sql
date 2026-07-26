GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_teacher_or_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.student_can_access_questions(uuid, uuid) TO authenticated, anon;