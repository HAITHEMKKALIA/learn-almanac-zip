CREATE TABLE IF NOT EXISTS public.guardian_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL,
  student_id uuid NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'parent',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','revoked')),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guardian_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guardian_links TO authenticated;
GRANT ALL ON public.guardian_links TO service_role;

ALTER TABLE public.guardian_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_guardian_of(_guardian uuid, _student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guardian_links
    WHERE guardian_id = _guardian AND student_id = _student AND status = 'approved'
  )
$$;

CREATE POLICY "guardian_links_self_select" ON public.guardian_links FOR SELECT
  USING (
    guardian_id = auth.uid()
    OR student_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  );

CREATE POLICY "guardian_links_parent_request" ON public.guardian_links FOR INSERT
  WITH CHECK (
    guardian_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  );

CREATE POLICY "guardian_links_admin_update" ON public.guardian_links FOR UPDATE
  USING (
    public.is_super_admin(auth.uid())
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  );

CREATE POLICY "guardian_links_admin_delete" ON public.guardian_links FOR DELETE
  USING (
    guardian_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  );

CREATE TRIGGER trg_guardian_links_updated
  BEFORE UPDATE ON public.guardian_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_guardian_links_guardian ON public.guardian_links(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_links_student ON public.guardian_links(student_id);