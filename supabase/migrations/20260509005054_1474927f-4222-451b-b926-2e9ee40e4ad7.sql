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
SECURITY INVOKER
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

REVOKE ALL ON FUNCTION public.get_class_roster(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_class_roster(uuid) TO authenticated;