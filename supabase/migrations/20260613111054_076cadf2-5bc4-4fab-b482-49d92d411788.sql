-- PHASE 7: AI Pedagogical Control
CREATE TABLE IF NOT EXISTS public.ai_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  daily_generation_cap integer NOT NULL DEFAULT 200,
  per_user_daily_cap integer NOT NULL DEFAULT 30,
  max_tokens_per_call integer NOT NULL DEFAULT 2000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);
GRANT SELECT ON public.ai_quotas TO authenticated;
GRANT ALL ON public.ai_quotas TO service_role;
ALTER TABLE public.ai_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_quotas read" ON public.ai_quotas FOR SELECT TO authenticated
  USING (school_id IS NULL OR public.is_school_member(school_id, auth.uid()));
CREATE POLICY "ai_quotas admin write" ON public.ai_quotas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid())))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid())));

CREATE OR REPLACE FUNCTION public.check_ai_quota(_school_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _per_user_cap integer;
  _daily_cap integer;
  _today_user_count integer;
  _today_school_count integer;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  SELECT COALESCE(per_user_daily_cap, 30), COALESCE(daily_generation_cap, 200)
    INTO _per_user_cap, _daily_cap
    FROM public.ai_quotas WHERE school_id IS NOT DISTINCT FROM _school_id LIMIT 1;
  _per_user_cap := COALESCE(_per_user_cap, 30);
  _daily_cap := COALESCE(_daily_cap, 200);

  SELECT count(*) INTO _today_user_count FROM public.ai_generation_logs
   WHERE requested_by = _uid AND created_at >= date_trunc('day', now());
  IF _today_user_count >= _per_user_cap THEN RETURN false; END IF;

  IF _school_id IS NOT NULL THEN
    SELECT count(*) INTO _today_school_count FROM public.ai_generation_logs l
     WHERE l.school_id = _school_id AND l.created_at >= date_trunc('day', now());
    IF _today_school_count >= _daily_cap THEN RETURN false; END IF;
  END IF;
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.check_ai_quota(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_ai_quota(uuid) TO authenticated;

-- PHASE 8: Certificates issuance + verification
CREATE OR REPLACE FUNCTION public.issue_certificate(
  _student_id uuid, _school_id uuid, _sub_level_id uuid, _final_score numeric,
  _class_id uuid DEFAULT NULL, _mention text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _id uuid;
  _number text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.has_role(_uid,'admin')
       OR public.is_school_owner(_school_id, _uid)
       OR public.has_role(_uid,'academic_director')
       OR public.has_role(_uid,'school_admin')
       OR public.has_role(_uid,'examiner')) THEN
    RAISE EXCEPTION 'not_authorized_to_issue_certificate';
  END IF;
  IF _final_score IS NULL OR _final_score < 0 OR _final_score > 100 THEN
    RAISE EXCEPTION 'invalid_score';
  END IF;

  _number := 'CERT-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  INSERT INTO public.certificates
    (student_id, school_id, sub_level_id, class_id, final_score, mention, certificate_number, issued_by, issued_at, status)
  VALUES
    (_student_id, _school_id, _sub_level_id, _class_id, _final_score, _mention, _number, _uid, now(), 'issued')
  RETURNING id INTO _id;

  RETURN _id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.issue_certificate(uuid, uuid, uuid, numeric, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_certificate(uuid, uuid, uuid, numeric, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_certificate(_number text)
RETURNS TABLE(certificate_number text, student_name text, school_name text, sub_level text, final_score numeric, mention text, issued_at timestamptz, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.certificate_number, p.display_name, s.name, sl.code, c.final_score, c.mention, c.issued_at, c.status
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.user_id = c.student_id
  LEFT JOIN public.schools s ON s.id = c.school_id
  LEFT JOIN public.sub_levels sl ON sl.id = c.sub_level_id
  WHERE c.certificate_number = _number AND c.status = 'issued'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO authenticated, anon;

-- PHASE 9: Reports
CREATE OR REPLACE FUNCTION public.class_progress_report(_class_id uuid)
RETURNS TABLE(
  student_id uuid, display_name text, email text,
  xp integer, level integer, current_streak integer,
  attended integer, total_sessions integer, attendance_rate numeric,
  last_activity_date date
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH att AS (
    SELECT ar.student_id,
           count(*) FILTER (WHERE ar.status = 'present')::int AS attended,
           count(*)::int AS total_sessions
    FROM public.attendance_records ar
    JOIN public.attendance_sessions s ON s.id = ar.session_id
    WHERE s.class_id = _class_id
    GROUP BY ar.student_id
  )
  SELECT
    cm.student_id, p.display_name, p.email,
    COALESCE(us.xp, 0), COALESCE(us.level, 1), COALESCE(us.current_streak, 0),
    COALESCE(att.attended, 0), COALESCE(att.total_sessions, 0),
    CASE WHEN COALESCE(att.total_sessions,0) = 0 THEN 0
         ELSE round((att.attended::numeric / att.total_sessions::numeric) * 100, 1) END,
    us.last_activity_date
  FROM public.class_members cm
  JOIN public.classes c ON c.id = cm.class_id
  LEFT JOIN public.profiles p ON p.user_id = cm.student_id
  LEFT JOIN public.user_stats us ON us.user_id = cm.student_id
  LEFT JOIN att ON att.student_id = cm.student_id
  WHERE cm.class_id = _class_id
    AND (c.teacher_id = auth.uid()
         OR public.is_class_teacher_any(_class_id, auth.uid())
         OR public.has_role(auth.uid(),'admin')
         OR public.is_school_owner(c.school_id, auth.uid()))
  ORDER BY p.display_name NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION public.class_progress_report(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.student_full_report(_student_id uuid)
RETURNS TABLE(
  xp integer, level integer, current_streak integer, longest_streak integer,
  badges_count integer, certificates_count integer, classes_count integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE((SELECT xp FROM public.user_stats WHERE user_id = _student_id), 0),
    COALESCE((SELECT level FROM public.user_stats WHERE user_id = _student_id), 1),
    COALESCE((SELECT current_streak FROM public.user_stats WHERE user_id = _student_id), 0),
    COALESCE((SELECT longest_streak FROM public.user_stats WHERE user_id = _student_id), 0),
    (SELECT count(*)::int FROM public.user_badges WHERE user_id = _student_id),
    (SELECT count(*)::int FROM public.certificates WHERE student_id = _student_id AND status = 'issued'),
    (SELECT count(*)::int FROM public.class_members WHERE student_id = _student_id)
  WHERE _student_id = auth.uid()
     OR public.has_role(auth.uid(),'admin')
     OR public.teacher_can_view_student(auth.uid(), _student_id);
$$;
GRANT EXECUTE ON FUNCTION public.student_full_report(uuid) TO authenticated;

-- PHASE 10: Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  school_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school ON public.audit_logs(school_id, created_at DESC);

CREATE POLICY "audit own read" ON public.audit_logs FOR SELECT TO authenticated
  USING (actor_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid())));
CREATE POLICY "audit self insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _target_table text, _target_id uuid, _school_id uuid, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, school_id, metadata)
  VALUES (auth.uid(), _action, _target_table, _target_id, _school_id, COALESCE(_metadata,'{}'::jsonb));
END; $$;
REVOKE EXECUTE ON FUNCTION public.log_audit(text, text, uuid, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, uuid, uuid, jsonb) TO authenticated;
