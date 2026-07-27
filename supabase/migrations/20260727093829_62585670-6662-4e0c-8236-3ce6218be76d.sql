
WITH ranked AS (
  SELECT s.id,
         ROW_NUMBER() OVER (PARTITION BY sm.user_id ORDER BY s.created_at DESC) AS rn
  FROM public.schools s
  JOIN public.school_members sm ON sm.school_id = s.id AND sm.role = 'student'
  WHERE s.tenant_type = 'independent_student'
)
DELETE FROM public.schools WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE OR REPLACE FUNCTION public.prevent_duplicate_solo_space()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_type = 'independent_student' THEN
    IF EXISTS (
      SELECT 1 FROM public.schools s
      JOIN public.school_members sm ON sm.school_id = s.id
      WHERE s.tenant_type = 'independent_student'
        AND sm.user_id = auth.uid()
        AND s.id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Vous avez déjà un espace d''apprentissage personnel.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_solo_space ON public.schools;
CREATE TRIGGER trg_prevent_duplicate_solo_space
BEFORE INSERT ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_solo_space();
