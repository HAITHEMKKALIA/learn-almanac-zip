
-- 1) plan_prices table
CREATE TABLE public.plan_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('platform','school')),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  label text NOT NULL,
  price_tnd numeric(10,2) NOT NULL DEFAULT 0,
  billing_period_months integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((scope = 'platform' AND school_id IS NULL) OR (scope = 'school' AND school_id IS NOT NULL))
);

CREATE UNIQUE INDEX plan_prices_platform_code_uniq
  ON public.plan_prices (plan_code) WHERE scope = 'platform';
CREATE UNIQUE INDEX plan_prices_school_code_uniq
  ON public.plan_prices (school_id, plan_code) WHERE scope = 'school';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_prices TO authenticated;
GRANT ALL ON public.plan_prices TO service_role;

ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_prices_read_platform ON public.plan_prices
  FOR SELECT TO authenticated
  USING (scope = 'platform');

CREATE POLICY plan_prices_read_school ON public.plan_prices
  FOR SELECT TO authenticated
  USING (scope = 'school' AND school_id IS NOT NULL AND public.is_school_member(school_id, auth.uid()));

CREATE POLICY plan_prices_platform_manage ON public.plan_prices
  FOR ALL TO authenticated
  USING (scope = 'platform' AND public.is_super_admin(auth.uid()))
  WITH CHECK (scope = 'platform' AND public.is_super_admin(auth.uid()));

CREATE POLICY plan_prices_school_manage ON public.plan_prices
  FOR ALL TO authenticated
  USING (
    scope = 'school' AND school_id IS NOT NULL AND (
      public.is_school_owner(school_id, auth.uid())
      OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin']::app_role[])
      OR public.is_super_admin(auth.uid())
    )
  )
  WITH CHECK (
    scope = 'school' AND school_id IS NOT NULL AND (
      public.is_school_owner(school_id, auth.uid())
      OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin']::app_role[])
      OR public.is_super_admin(auth.uid())
    )
  );

CREATE TRIGGER plan_prices_set_updated_at
  BEFORE UPDATE ON public.plan_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) trial on schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

UPDATE public.schools
SET trial_ends_at = created_at + interval '15 days'
WHERE trial_ends_at IS NULL AND tenant_type IN ('school','institute','teacher_studio');

CREATE OR REPLACE FUNCTION public.set_school_trial_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL AND NEW.tenant_type IN ('school','institute','teacher_studio') THEN
    NEW.trial_ends_at := COALESCE(NEW.created_at, now()) + interval '15 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS schools_set_trial_default ON public.schools;
CREATE TRIGGER schools_set_trial_default
  BEFORE INSERT ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.set_school_trial_default();

-- 3) Extend subscriptions policies so school admins can manage student subs
--    and each student can see their own subscription.
DROP POLICY IF EXISTS subscriptions_select_owner_only ON public.subscriptions;

CREATE POLICY subscriptions_select_scoped ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR owner_user_id = auth.uid()
    OR (school_id IS NOT NULL AND (
      public.is_school_owner(school_id, auth.uid())
      OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin']::app_role[])
    ))
  );

CREATE POLICY subscriptions_school_manage ON public.subscriptions
  FOR ALL TO authenticated
  USING (
    school_id IS NOT NULL AND (
      public.is_school_owner(school_id, auth.uid())
      OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin']::app_role[])
    )
  )
  WITH CHECK (
    school_id IS NOT NULL AND (
      public.is_school_owner(school_id, auth.uid())
      OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin']::app_role[])
    )
  );

-- 4) Seed default platform prices
INSERT INTO public.plan_prices (scope, plan_code, label, price_tnd, billing_period_months, sort_order)
VALUES
  ('platform','student','Élève (individuel)', 25, 1, 10),
  ('platform','teacher','Professeur indépendant', 79, 1, 20),
  ('platform','small_school','Petite école (jusqu''à 50 élèves)', 199, 1, 30),
  ('platform','school','École (jusqu''à 200 élèves)', 399, 1, 40),
  ('platform','institute','Institut (illimité)', 699, 1, 50)
ON CONFLICT DO NOTHING;
