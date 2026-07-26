
-- Rename default school to Alfa
UPDATE public.schools SET name = 'Alfa', slug = 'alfa' WHERE slug = 'ecole-par-defaut';

-- RPC: admin assigns a user (approval + role + school + optional class) in one shot
CREATE OR REPLACE FUNCTION public.admin_assign_user(
  _target uuid,
  _school_id uuid,
  _role public.app_role,
  _class_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _school_role public.school_role;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_school_owner(_school_id, auth.uid())) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Approve profile
  UPDATE public.profiles SET approved = true, updated_at = now() WHERE user_id = _target;

  -- Assign app role
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Map app role -> school role
  _school_role := CASE WHEN _role = 'admin' THEN 'owner'::public.school_role
                       WHEN _role = 'teacher' THEN 'teacher'::public.school_role
                       ELSE 'student'::public.school_role END;

  -- Add to school
  INSERT INTO public.school_members (school_id, user_id, role)
  VALUES (_school_id, _target, _school_role)
  ON CONFLICT DO NOTHING;

  -- Optional: add to class
  IF _class_id IS NOT NULL AND _role = 'student' THEN
    INSERT INTO public.class_members (class_id, student_id)
    VALUES (_class_id, _target)
    ON CONFLICT (class_id, student_id) DO NOTHING;
  END IF;
END;
$$;

-- RPC: list every member of a school with details (admin/owner only)
CREATE OR REPLACE FUNCTION public.school_members_full(_school_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  email text,
  approved boolean,
  school_role public.school_role,
  app_roles text[],
  classes text[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sm.user_id,
    p.display_name,
    p.email,
    COALESCE(p.approved, false) AS approved,
    sm.role AS school_role,
    COALESCE(array_agg(DISTINCT ur.role::text) FILTER (WHERE ur.role IS NOT NULL), '{}'::text[]) AS app_roles,
    COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}'::text[]) AS classes
  FROM public.school_members sm
  LEFT JOIN public.profiles p ON p.user_id = sm.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = sm.user_id
  LEFT JOIN public.class_members cm ON cm.student_id = sm.user_id
  LEFT JOIN public.classes c ON c.id = cm.class_id AND c.school_id = _school_id
  WHERE sm.school_id = _school_id
    AND (public.has_role(auth.uid(), 'admin') OR public.is_school_teacher(_school_id, auth.uid()))
  GROUP BY sm.user_id, p.display_name, p.email, p.approved, sm.role
  ORDER BY p.display_name NULLS LAST;
$$;

-- RPC: remove a member from a class
CREATE OR REPLACE FUNCTION public.admin_remove_from_class(_target uuid, _class_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _school uuid;
BEGIN
  SELECT school_id INTO _school FROM public.classes WHERE id = _class_id;
  IF _school IS NULL THEN RAISE EXCEPTION 'class_not_found'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_school_owner(_school, auth.uid())) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  DELETE FROM public.class_members WHERE student_id = _target AND class_id = _class_id;
END;
$$;

-- RPC: admin creates a class in a school for a chosen teacher
CREATE OR REPLACE FUNCTION public.admin_create_class(_school_id uuid, _name text, _level text, _teacher_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_school_owner(_school_id, auth.uid())) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  INSERT INTO public.classes (school_id, name, level, teacher_id)
  VALUES (_school_id, _name, _level::public.app_level, _teacher_id)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
