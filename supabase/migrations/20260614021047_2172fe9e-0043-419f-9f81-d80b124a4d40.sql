CREATE OR REPLACE FUNCTION public.admin_pending_profiles()
RETURNS TABLE(user_id uuid, display_name text, email text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.email, p.created_at
  FROM public.profiles p
  WHERE p.approved = false
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_pending_members()
RETURNS TABLE(
  id uuid, school_id uuid, user_id uuid, role text, status text, joined_at timestamp with time zone,
  school_name text, display_name text, email text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sm.id, sm.school_id, sm.user_id, sm.role::text, sm.status, sm.joined_at,
    s.name AS school_name, p.display_name, p.email
  FROM public.school_members sm
  LEFT JOIN public.schools s ON s.id = sm.school_id
  LEFT JOIN public.profiles p ON p.user_id = sm.user_id
  WHERE sm.status = 'pending' OR sm.status IS NULL
  ORDER BY sm.joined_at DESC;
$$;