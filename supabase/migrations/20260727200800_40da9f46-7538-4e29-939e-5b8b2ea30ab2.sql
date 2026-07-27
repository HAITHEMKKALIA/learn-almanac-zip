
CREATE OR REPLACE FUNCTION public.request_join_school(_school_id uuid, _role text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _school_role school_role;
  _existing_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _role NOT IN ('student','teacher') THEN RAISE EXCEPTION 'invalid_role'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.schools
    WHERE id = _school_id AND tenant_type = 'school' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'school_not_available';
  END IF;

  _school_role := (CASE WHEN _role = 'teacher' THEN 'teacher' ELSE 'student' END)::school_role;

  SELECT id INTO _existing_id
  FROM public.school_members
  WHERE school_id = _school_id AND user_id = _uid AND role = _school_role
  LIMIT 1;

  IF _existing_id IS NOT NULL THEN RETURN _existing_id; END IF;

  INSERT INTO public.school_members (school_id, user_id, role, space_role, status)
  VALUES (_school_id, _uid, _school_role, _role::app_role, 'pending')
  RETURNING id INTO _existing_id;

  RETURN _existing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_join_school(uuid, text) TO authenticated;
