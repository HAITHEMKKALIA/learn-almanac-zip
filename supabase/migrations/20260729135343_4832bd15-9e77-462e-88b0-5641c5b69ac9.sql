
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('school','teacher_studio','student_solo','platform')),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  owner_user_id uuid,
  direction text NOT NULL CHECK (direction IN ('income','expense')),
  category text NOT NULL,
  description text,
  amount_tnd numeric(12,3) NOT NULL CHECK (amount_tnd >= 0),
  transaction_date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  payment_method text,
  reference text,
  related_subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_scope_school ON public.transactions(scope, school_id, transaction_date DESC);
CREATE INDEX idx_transactions_owner ON public.transactions(owner_user_id, transaction_date DESC);
CREATE INDEX idx_transactions_platform ON public.transactions(scope, transaction_date DESC) WHERE scope = 'platform';
CREATE UNIQUE INDEX uq_transactions_sub_scope ON public.transactions(related_subscription_id, scope) WHERE related_subscription_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "tx_select_school_manager" ON public.transactions FOR SELECT TO authenticated
USING (
  scope = 'school'
  AND school_id IS NOT NULL
  AND (public.is_school_owner(school_id, auth.uid()) OR public.is_super_admin(auth.uid()))
);
CREATE POLICY "tx_select_studio_owner" ON public.transactions FOR SELECT TO authenticated
USING (
  scope = 'teacher_studio'
  AND (owner_user_id = auth.uid() OR public.is_super_admin(auth.uid()))
);
CREATE POLICY "tx_select_solo_owner" ON public.transactions FOR SELECT TO authenticated
USING (
  scope = 'student_solo'
  AND (owner_user_id = auth.uid() OR public.is_super_admin(auth.uid()))
);
CREATE POLICY "tx_select_platform_super" ON public.transactions FOR SELECT TO authenticated
USING (scope = 'platform' AND public.is_super_admin(auth.uid()));

-- INSERT
CREATE POLICY "tx_insert_school_manager" ON public.transactions FOR INSERT TO authenticated
WITH CHECK (
  scope = 'school'
  AND school_id IS NOT NULL
  AND created_by = auth.uid()
  AND (public.is_school_owner(school_id, auth.uid()) OR public.is_super_admin(auth.uid()))
);
CREATE POLICY "tx_insert_studio_owner" ON public.transactions FOR INSERT TO authenticated
WITH CHECK (
  scope = 'teacher_studio'
  AND owner_user_id = auth.uid()
  AND created_by = auth.uid()
);
CREATE POLICY "tx_insert_platform_super" ON public.transactions FOR INSERT TO authenticated
WITH CHECK (scope = 'platform' AND created_by = auth.uid() AND public.is_super_admin(auth.uid()));

-- UPDATE
CREATE POLICY "tx_update_school_manager" ON public.transactions FOR UPDATE TO authenticated
USING (scope = 'school' AND school_id IS NOT NULL AND (public.is_school_owner(school_id, auth.uid()) OR public.is_super_admin(auth.uid())))
WITH CHECK (scope = 'school' AND school_id IS NOT NULL AND (public.is_school_owner(school_id, auth.uid()) OR public.is_super_admin(auth.uid())));
CREATE POLICY "tx_update_studio_owner" ON public.transactions FOR UPDATE TO authenticated
USING (scope = 'teacher_studio' AND (owner_user_id = auth.uid() OR public.is_super_admin(auth.uid())))
WITH CHECK (scope = 'teacher_studio' AND (owner_user_id = auth.uid() OR public.is_super_admin(auth.uid())));
CREATE POLICY "tx_update_platform_super" ON public.transactions FOR UPDATE TO authenticated
USING (scope = 'platform' AND public.is_super_admin(auth.uid()))
WITH CHECK (scope = 'platform' AND public.is_super_admin(auth.uid()));

-- DELETE
CREATE POLICY "tx_delete_school_manager" ON public.transactions FOR DELETE TO authenticated
USING (scope = 'school' AND school_id IS NOT NULL AND (public.is_school_owner(school_id, auth.uid()) OR public.is_super_admin(auth.uid())));
CREATE POLICY "tx_delete_studio_owner" ON public.transactions FOR DELETE TO authenticated
USING (scope = 'teacher_studio' AND (owner_user_id = auth.uid() OR public.is_super_admin(auth.uid())));
CREATE POLICY "tx_delete_platform_super" ON public.transactions FOR DELETE TO authenticated
USING (scope = 'platform' AND public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate income transactions from paid subscriptions
CREATE OR REPLACE FUNCTION public.subscription_to_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _scope text;
  _tenant text;
  _date date;
  _desc text;
BEGIN
  IF NEW.paid_at IS NULL OR NEW.status NOT IN ('active','paid') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.paid_at IS NOT DISTINCT FROM NEW.paid_at AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  _date := COALESCE(NEW.paid_at::date, NEW.starts_at::date, CURRENT_DATE);
  SELECT tenant_type::text INTO _tenant FROM public.schools WHERE id = NEW.school_id;

  IF NEW.owner_user_id IS NOT NULL THEN
    _scope := CASE _tenant
      WHEN 'independent_teacher' THEN 'teacher_studio'
      WHEN 'independent_student' THEN 'student_solo'
      ELSE 'school'
    END;
    _desc := 'Abonnement ' || COALESCE(NEW.plan, '') || ' — ' || COALESCE(NEW.invoice_number, NEW.id::text);
    INSERT INTO public.transactions
      (scope, school_id, owner_user_id, direction, category, description,
       amount_tnd, transaction_date, payment_method, reference, related_subscription_id, created_by)
    VALUES
      (_scope, NEW.school_id,
       CASE WHEN _scope = 'school' THEN NULL ELSE NEW.owner_user_id END,
       'income', 'subscription', _desc,
       NEW.price_tnd, _date, NEW.payment_method, NEW.invoice_number, NEW.id, NEW.owner_user_id)
    ON CONFLICT (related_subscription_id, scope) WHERE related_subscription_id IS NOT NULL DO NOTHING;
  END IF;

  -- Platform-wide revenue (school-paid or independent-paid subscriptions)
  _desc := 'Abonnement ' || COALESCE(_tenant, 'school') || ' — ' || COALESCE(NEW.invoice_number, NEW.id::text);
  INSERT INTO public.transactions
    (scope, school_id, owner_user_id, direction, category, description,
     amount_tnd, transaction_date, payment_method, reference, related_subscription_id, created_by)
  VALUES
    ('platform', NEW.school_id, NEW.owner_user_id,
     'income', 'subscription', _desc,
     NEW.price_tnd, _date, NEW.payment_method, NEW.invoice_number, NEW.id,
     COALESCE(NEW.owner_user_id, (SELECT owner_id FROM public.schools WHERE id = NEW.school_id)))
  ON CONFLICT (related_subscription_id, scope) WHERE related_subscription_id IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscription_to_transactions ON public.subscriptions;
CREATE TRIGGER trg_subscription_to_transactions
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.subscription_to_transactions();

-- Backfill existing paid subscriptions
INSERT INTO public.transactions
  (scope, school_id, owner_user_id, direction, category, description,
   amount_tnd, transaction_date, payment_method, reference, related_subscription_id, created_by)
SELECT
  CASE s.tenant_type::text
    WHEN 'independent_teacher' THEN 'teacher_studio'
    WHEN 'independent_student' THEN 'student_solo'
    ELSE 'school'
  END,
  sub.school_id,
  CASE s.tenant_type::text WHEN 'school' THEN NULL ELSE sub.owner_user_id END,
  'income', 'subscription',
  'Abonnement ' || COALESCE(sub.plan,'') || ' — ' || COALESCE(sub.invoice_number, sub.id::text),
  sub.price_tnd,
  COALESCE(sub.paid_at::date, sub.starts_at::date, CURRENT_DATE),
  sub.payment_method, sub.invoice_number, sub.id,
  sub.owner_user_id
FROM public.subscriptions sub
JOIN public.schools s ON s.id = sub.school_id
WHERE sub.owner_user_id IS NOT NULL
  AND sub.paid_at IS NOT NULL
  AND sub.status IN ('active','paid')
ON CONFLICT (related_subscription_id, scope) WHERE related_subscription_id IS NOT NULL DO NOTHING;

INSERT INTO public.transactions
  (scope, school_id, owner_user_id, direction, category, description,
   amount_tnd, transaction_date, payment_method, reference, related_subscription_id, created_by)
SELECT
  'platform', sub.school_id, sub.owner_user_id,
  'income', 'subscription',
  'Abonnement ' || COALESCE(s.tenant_type::text,'school') || ' — ' || COALESCE(sub.invoice_number, sub.id::text),
  sub.price_tnd,
  COALESCE(sub.paid_at::date, sub.starts_at::date, CURRENT_DATE),
  sub.payment_method, sub.invoice_number, sub.id,
  COALESCE(sub.owner_user_id, s.owner_id)
FROM public.subscriptions sub
JOIN public.schools s ON s.id = sub.school_id
WHERE sub.paid_at IS NOT NULL AND sub.status IN ('active','paid')
ON CONFLICT (related_subscription_id, scope) WHERE related_subscription_id IS NOT NULL DO NOTHING;
