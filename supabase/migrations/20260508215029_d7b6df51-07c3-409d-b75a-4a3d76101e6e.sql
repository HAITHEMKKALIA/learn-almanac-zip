
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_teacher_or_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.student_can_access_questions(uuid, uuid) FROM authenticated;
