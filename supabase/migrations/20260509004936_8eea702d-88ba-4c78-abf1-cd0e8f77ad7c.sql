CREATE POLICY "Admins manage class members"
ON public.class_members
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.join_class_by_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _class_id uuid;
  _uid uuid := auth.uid();
  _clean_code text := upper(trim(coalesce(_code, '')));
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _clean_code = '' THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  SELECT id INTO _class_id
  FROM public.classes
  WHERE upper(invite_code) = _clean_code
  LIMIT 1;

  IF _class_id IS NULL THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.class_members (class_id, student_id)
  VALUES (_class_id, _uid)
  ON CONFLICT (class_id, student_id) DO NOTHING;

  RETURN _class_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_class_roster(_class_id uuid)
RETURNS TABLE (
  student_id uuid,
  joined_at timestamp with time zone,
  display_name text,
  email text,
  gender text,
  avatar_url text,
  approved boolean,
  roles text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    cm.student_id,
    cm.joined_at,
    p.display_name,
    p.email,
    p.gender,
    p.avatar_url,
    COALESCE(p.approved, false) AS approved,
    COALESCE(array_agg(DISTINCT ur.role::text) FILTER (WHERE ur.role IS NOT NULL), '{}'::text[]) AS roles
  FROM public.class_members cm
  JOIN public.classes c ON c.id = cm.class_id
  LEFT JOIN public.profiles p ON p.user_id = cm.student_id
  LEFT JOIN public.user_roles ur ON ur.user_id = cm.student_id
  WHERE cm.class_id = _class_id
    AND (
      c.teacher_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR cm.student_id = auth.uid()
    )
  GROUP BY cm.student_id, cm.joined_at, p.display_name, p.email, p.gender, p.avatar_url, p.approved
  ORDER BY cm.joined_at ASC;
$function$;