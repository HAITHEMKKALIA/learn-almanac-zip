
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_teacher_or_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.student_can_access_questions(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_or_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_can_access_questions(uuid, uuid) TO authenticated;
