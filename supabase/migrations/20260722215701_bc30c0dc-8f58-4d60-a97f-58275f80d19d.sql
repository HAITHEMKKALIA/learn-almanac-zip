
-- Devis
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  organization text,
  plan text NOT NULL,
  student_count int,
  message text,
  status text NOT NULL DEFAULT 'new',
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT INSERT ON public.quote_requests TO anon;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request a quote"
  ON public.quote_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Super admin manage quotes"
  ON public.quote_requests FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER quote_requests_updated
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Abonnements
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  owner_user_id uuid,
  plan text NOT NULL,
  price_tnd numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  starts_at date NOT NULL DEFAULT (now()::date),
  ends_at date,
  paid_at timestamptz,
  payment_method text,
  invoice_number text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view their school subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (school_id IS NOT NULL AND public.is_school_member(school_id, auth.uid()))
    OR owner_user_id = auth.uid()
  );

CREATE POLICY "Super admin manage subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_subscriptions_school ON public.subscriptions(school_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_quote_requests_status ON public.quote_requests(status);
