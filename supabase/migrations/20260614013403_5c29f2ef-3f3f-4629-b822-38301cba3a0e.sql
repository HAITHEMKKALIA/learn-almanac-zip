
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS tenant_type text NOT NULL DEFAULT 'school',
  ADD COLUMN IF NOT EXISTS is_independent boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='schools_tenant_type_check') THEN
    ALTER TABLE public.schools ADD CONSTRAINT schools_tenant_type_check
      CHECK (tenant_type IN ('school','independent_teacher','independent_student','platform'));
  END IF;
END $$;

UPDATE public.schools SET tenant_type='school' WHERE tenant_type IS NULL;

CREATE TABLE IF NOT EXISTS public.teacher_studio_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  studio_name text NOT NULL,
  public_profile_enabled boolean NOT NULL DEFAULT false,
  allow_student_self_join boolean NOT NULL DEFAULT true,
  require_teacher_approval boolean NOT NULL DEFAULT true,
  allow_online_classes boolean NOT NULL DEFAULT true,
  allow_certificates boolean NOT NULL DEFAULT true,
  default_level text,
  default_language text DEFAULT 'de',
  max_students_per_class integer DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_studio_settings TO authenticated;
GRANT ALL ON public.teacher_studio_settings TO service_role;
ALTER TABLE public.teacher_studio_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tss_owner_all ON public.teacher_studio_settings;
CREATE POLICY tss_owner_all ON public.teacher_studio_settings FOR ALL TO authenticated
  USING (teacher_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (teacher_id = auth.uid() OR public.is_super_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_tss_updated ON public.teacher_studio_settings;
CREATE TRIGGER trg_tss_updated BEFORE UPDATE ON public.teacher_studio_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.solo_student_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  current_level text DEFAULT 'A1.1',
  target_level text DEFAULT 'B2.2',
  learning_goal text,
  weekly_goal_minutes integer DEFAULT 120,
  ai_tutor_enabled boolean NOT NULL DEFAULT true,
  public_progress_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solo_student_settings TO authenticated;
GRANT ALL ON public.solo_student_settings TO service_role;
ALTER TABLE public.solo_student_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sss_owner_all ON public.solo_student_settings;
CREATE POLICY sss_owner_all ON public.solo_student_settings FOR ALL TO authenticated
  USING (student_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (student_id = auth.uid() OR public.is_super_admin(auth.uid()));
DROP TRIGGER IF EXISTS trg_sss_updated ON public.solo_student_settings;
CREATE TRIGGER trg_sss_updated BEFORE UPDATE ON public.solo_student_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS certificate_kind text NOT NULL DEFAULT 'official_school',
  ADD COLUMN IF NOT EXISTS issuer_type text NOT NULL DEFAULT 'school';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='certificates_kind_check') THEN
    ALTER TABLE public.certificates ADD CONSTRAINT certificates_kind_check
      CHECK (certificate_kind IN ('official_school','teacher_private','self_progress'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='certificates_issuer_type_check') THEN
    ALTER TABLE public.certificates ADD CONSTRAINT certificates_issuer_type_check
      CHECK (issuer_type IN ('school','independent_teacher','self'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_independent_teacher_owner(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.schools s WHERE s.id=_school_id AND s.tenant_type='independent_teacher' AND s.owner_id=_user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_independent_student_owner(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.schools s WHERE s.id=_school_id AND s.tenant_type='independent_student' AND s.owner_id=_user_id)
$$;

CREATE OR REPLACE FUNCTION public.can_access_learning_space(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_super_admin(_user_id)
      OR public.is_school_member(_school_id, _user_id)
      OR public.is_independent_teacher_owner(_user_id, _school_id)
      OR public.is_independent_student_owner(_user_id, _school_id)
$$;

CREATE OR REPLACE FUNCTION public.can_manage_learning_space(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_super_admin(_user_id)
      OR public.is_school_owner(_school_id, _user_id)
      OR public.is_independent_teacher_owner(_user_id, _school_id)
      OR public.is_independent_student_owner(_user_id, _school_id)
$$;

CREATE OR REPLACE FUNCTION public.create_independent_teacher_space(_studio_name text, _display_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid := auth.uid(); _school_id uuid; _slug text; _name text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  _name := COALESCE(NULLIF(trim(_studio_name),''), 'Mon Studio');
  _slug := lower(regexp_replace(_name,'[^a-zA-Z0-9]+','-','g')) || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);
  INSERT INTO public.schools(name, slug, owner_id, status, tenant_type, is_independent, legal_name)
  VALUES (_name, _slug, _uid, 'active', 'independent_teacher', true, COALESCE(_display_name, _name))
  RETURNING id INTO _school_id;
  INSERT INTO public.school_members(school_id, user_id, role) VALUES (_school_id, _uid, 'owner'::public.school_role) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'teacher') ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET approved=true, updated_at=now() WHERE user_id=_uid;
  INSERT INTO public.teacher_studio_settings(school_id, teacher_id, studio_name) VALUES (_school_id, _uid, _name) ON CONFLICT (school_id) DO NOTHING;
  RETURN _school_id;
END;$$;

CREATE OR REPLACE FUNCTION public.create_independent_student_space(_current_level text DEFAULT 'A1.1')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid := auth.uid(); _school_id uuid; _slug text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  _slug := 'solo-' || substr(replace(gen_random_uuid()::text,'-',''),1,10);
  INSERT INTO public.schools(name, slug, owner_id, status, tenant_type, is_independent)
  VALUES ('Apprentissage personnel', _slug, _uid, 'active', 'independent_student', true)
  RETURNING id INTO _school_id;
  INSERT INTO public.school_members(school_id, user_id, role) VALUES (_school_id, _uid, 'student'::public.school_role) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'student') ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET approved=true, updated_at=now() WHERE user_id=_uid;
  INSERT INTO public.solo_student_settings(school_id, student_id, current_level) VALUES (_school_id, _uid, COALESCE(_current_level,'A1.1')) ON CONFLICT (school_id) DO NOTHING;
  RETURN _school_id;
END;$$;

CREATE OR REPLACE FUNCTION public.my_learning_spaces()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, role public.school_role, tenant_type text, is_independent boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT s.id, s.name, s.slug, s.logo_url, sm.role, s.tenant_type, s.is_independent
  FROM public.schools s
  JOIN public.school_members sm ON sm.school_id = s.id
  WHERE sm.user_id = auth.uid()
  ORDER BY CASE s.tenant_type WHEN 'school' THEN 1 WHEN 'independent_teacher' THEN 2 WHEN 'independent_student' THEN 3 ELSE 9 END, s.name;
$$;

-- Additive RLS for tables that have school_id
DROP POLICY IF EXISTS classes_indep_owner_all ON public.classes;
CREATE POLICY classes_indep_owner_all ON public.classes FOR ALL TO authenticated
  USING (public.is_independent_teacher_owner(auth.uid(), school_id))
  WITH CHECK (public.is_independent_teacher_owner(auth.uid(), school_id));

DROP POLICY IF EXISTS certificates_indep_owner_all ON public.certificates;
CREATE POLICY certificates_indep_owner_all ON public.certificates FOR ALL TO authenticated
  USING (public.is_independent_teacher_owner(auth.uid(), school_id) OR public.is_independent_student_owner(auth.uid(), school_id))
  WITH CHECK (public.is_independent_teacher_owner(auth.uid(), school_id) OR public.is_independent_student_owner(auth.uid(), school_id));

DROP POLICY IF EXISTS calendar_indep_owner_all ON public.calendar_events;
CREATE POLICY calendar_indep_owner_all ON public.calendar_events FOR ALL TO authenticated
  USING (public.is_independent_teacher_owner(auth.uid(), school_id) OR public.is_independent_student_owner(auth.uid(), school_id))
  WITH CHECK (public.is_independent_teacher_owner(auth.uid(), school_id) OR public.is_independent_student_owner(auth.uid(), school_id));

DROP POLICY IF EXISTS announcements_indep_owner_all ON public.announcements;
CREATE POLICY announcements_indep_owner_all ON public.announcements FOR ALL TO authenticated
  USING (public.is_independent_teacher_owner(auth.uid(), school_id) OR public.is_independent_student_owner(auth.uid(), school_id))
  WITH CHECK (public.is_independent_teacher_owner(auth.uid(), school_id) OR public.is_independent_student_owner(auth.uid(), school_id));
