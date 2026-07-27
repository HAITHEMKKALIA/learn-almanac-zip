
-- Set school status (active/suspended/archived/pending)
CREATE OR REPLACE FUNCTION public.admin_set_school_status(_school_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF _status NOT IN ('active','suspended','archived','pending','rejected') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;
  UPDATE public.schools SET status = _status, updated_at = now() WHERE id = _school_id;
END;
$$;

-- Delete a school (cascades via existing FKs where defined)
CREATE OR REPLACE FUNCTION public.admin_delete_school(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  DELETE FROM public.schools WHERE id = _school_id;
END;
$$;

-- Set class status
CREATE OR REPLACE FUNCTION public.admin_set_class_status(_class_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF _status NOT IN ('active','suspended','archived') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;
  UPDATE public.classes SET status = _status, updated_at = now() WHERE id = _class_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_class(_class_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  DELETE FROM public.classes WHERE id = _class_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_school_status(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_school(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_class_status(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_class(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_school_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_school(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_class_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_class(uuid) TO authenticated;
