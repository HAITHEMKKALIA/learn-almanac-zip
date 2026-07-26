REVOKE ALL ON FUNCTION public.join_class_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_class_roster(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_class_roster(uuid) TO authenticated;