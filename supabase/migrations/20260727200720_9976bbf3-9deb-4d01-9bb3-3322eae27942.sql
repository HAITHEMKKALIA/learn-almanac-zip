
CREATE OR REPLACE FUNCTION public.list_public_schools()
RETURNS TABLE(id uuid, name text, kind text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name,
    COALESCE(NULLIF(s.tenant_type::text, ''), 'school') AS kind
  FROM public.schools s
  WHERE s.status = 'active'
    AND s.tenant_type = 'school'
  ORDER BY s.name ASC
$$;

GRANT EXECUTE ON FUNCTION public.list_public_schools() TO anon, authenticated;
