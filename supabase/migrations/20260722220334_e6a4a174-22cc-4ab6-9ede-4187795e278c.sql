
-- Consent tracking on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_year int,
  ADD COLUMN IF NOT EXISTS is_minor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS guardian_email text,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

-- Consent log
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL,
  granted boolean NOT NULL,
  version text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.consent_logs TO authenticated;
GRANT ALL ON public.consent_logs TO service_role;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own consent" ON public.consent_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user inserts own consent" ON public.consent_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin reads all consent" ON public.consent_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Export current user's data as JSON
CREATE OR REPLACE FUNCTION public.gdpr_export_my_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _out jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', _uid,
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.user_id=_uid),
    'roles', (SELECT jsonb_agg(role) FROM public.user_roles WHERE user_id=_uid),
    'school_memberships', (SELECT jsonb_agg(to_jsonb(sm)) FROM public.school_members sm WHERE sm.user_id=_uid),
    'classes', (SELECT jsonb_agg(to_jsonb(cm)) FROM public.class_members cm WHERE cm.student_id=_uid),
    'submissions', (SELECT jsonb_agg(to_jsonb(s)) FROM public.submissions s WHERE s.student_id=_uid),
    'homework_submissions', (SELECT jsonb_agg(to_jsonb(h)) FROM public.homework_submissions h WHERE h.student_id=_uid),
    'certificates', (SELECT jsonb_agg(to_jsonb(c)) FROM public.certificates c WHERE c.student_id=_uid),
    'stats', (SELECT to_jsonb(us) FROM public.user_stats us WHERE us.user_id=_uid),
    'badges', (SELECT jsonb_agg(to_jsonb(ub)) FROM public.user_badges ub WHERE ub.user_id=_uid),
    'xp_events', (SELECT jsonb_agg(to_jsonb(xe)) FROM public.xp_events xe WHERE xe.user_id=_uid),
    'chat_history', (SELECT jsonb_agg(to_jsonb(ch)) FROM public.chat_history ch WHERE ch.user_id=_uid),
    'progress', (SELECT jsonb_agg(to_jsonb(up)) FROM public.user_progress up WHERE up.user_id=_uid),
    'consent_logs', (SELECT jsonb_agg(to_jsonb(cl)) FROM public.consent_logs cl WHERE cl.user_id=_uid)
  ) INTO _out;
  RETURN _out;
END; $$;

-- User-initiated deletion request (soft mark; hard delete via admin_delete_user)
CREATE OR REPLACE FUNCTION public.gdpr_request_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  UPDATE public.profiles SET deletion_requested_at = now(), updated_at = now() WHERE user_id = _uid;
  INSERT INTO public.consent_logs (user_id, consent_type, granted, metadata)
  VALUES (_uid, 'deletion_request', true, jsonb_build_object('requested_at', now()));
END; $$;

-- Admin export of any user
CREATE OR REPLACE FUNCTION public.admin_gdpr_export(_target uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _out jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  SELECT jsonb_build_object(
    'exported_at', now(), 'user_id', _target,
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.user_id=_target),
    'roles', (SELECT jsonb_agg(role) FROM public.user_roles WHERE user_id=_target),
    'school_memberships', (SELECT jsonb_agg(to_jsonb(sm)) FROM public.school_members sm WHERE sm.user_id=_target),
    'classes', (SELECT jsonb_agg(to_jsonb(cm)) FROM public.class_members cm WHERE cm.student_id=_target),
    'submissions', (SELECT jsonb_agg(to_jsonb(s)) FROM public.submissions s WHERE s.student_id=_target),
    'certificates', (SELECT jsonb_agg(to_jsonb(c)) FROM public.certificates c WHERE c.student_id=_target),
    'consent_logs', (SELECT jsonb_agg(to_jsonb(cl)) FROM public.consent_logs cl WHERE cl.user_id=_target)
  ) INTO _out;
  RETURN _out;
END; $$;

-- List users who requested deletion (admin)
CREATE OR REPLACE FUNCTION public.admin_deletion_requests()
RETURNS TABLE(user_id uuid, display_name text, email text, requested_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.email, p.deletion_requested_at
  FROM public.profiles p
  WHERE p.deletion_requested_at IS NOT NULL
    AND public.has_role(auth.uid(),'admin')
  ORDER BY p.deletion_requested_at ASC;
$$;
