
-- =====================================================================
-- 2. SUPER ADMIN BOOTSTRAP
-- =====================================================================

-- Helper: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'super_admin') $$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

-- Backfill: assign super_admin to existing haithem.kalia@gmail.com user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'haithem.kalia@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Future-proof: extend handle_new_user so this email always becomes super_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    NEW.email,
    -- super admin is auto-approved
    CASE WHEN lower(NEW.email) = 'haithem.kalia@gmail.com' THEN true ELSE false END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;
  IF lower(NEW.email) = 'haithem.kalia@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- =====================================================================
-- 3. SUPER ADMIN GETS GLOBAL ACCESS via existing helpers
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_school_owner(_school_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.school_members
                 WHERE school_id = _school_id AND user_id = _user_id AND role = 'owner')
$$;

CREATE OR REPLACE FUNCTION public.is_school_member(_school_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.school_members
                 WHERE school_id = _school_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_school_teacher(_school_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.school_members
                 WHERE school_id = _school_id AND user_id = _user_id
                   AND role IN ('teacher','owner'))
$$;

CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_class_teacher_any(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.teacher_assignments WHERE class_id = _class_id AND teacher_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('teacher','admin'))
$$;

CREATE OR REPLACE FUNCTION public.is_approved_member(_user_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.school_members sm
        JOIN public.profiles p ON p.user_id = sm.user_id
        WHERE sm.school_id = _school_id AND sm.user_id = _user_id
          AND COALESCE(p.approved, false) = true
      )
$$;

REVOKE EXECUTE ON FUNCTION public.is_approved_member(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_approved_member(uuid, uuid) TO authenticated, service_role;

-- =====================================================================
-- 4. SCHOOLS — administrative columns
-- =====================================================================
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS address    text,
  ADD COLUMN IF NOT EXISTS city       text,
  ADD COLUMN IF NOT EXISTS country    text,
  ADD COLUMN IF NOT EXISTS phone      text,
  ADD COLUMN IF NOT EXISTS email      text,
  ADD COLUMN IF NOT EXISTS website    text,
  ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending','active','suspended','archived')),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Super admin can do everything on schools
DROP POLICY IF EXISTS "super admin manages schools" ON public.schools;
CREATE POLICY "super admin manages schools" ON public.schools
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================================
-- 5. SCHOOL_MEMBERS — status workflow
-- =====================================================================
ALTER TABLE public.school_members
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending','approved','suspended','rejected')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Super admin can manage school memberships
DROP POLICY IF EXISTS "super admin manages school_members" ON public.school_members;
CREATE POLICY "super admin manages school_members" ON public.school_members
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================================
-- 6. CLASSES — extra fields
-- =====================================================================
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS max_students          integer,
  ADD COLUMN IF NOT EXISTS current_students_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS room                  text,
  ADD COLUMN IF NOT EXISTS schedule_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sub_level_id          uuid REFERENCES public.sub_levels(id),
  ADD COLUMN IF NOT EXISTS term_id               uuid REFERENCES public.school_terms(id),
  ADD COLUMN IF NOT EXISTS status                text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','open','active','completed','archived'));

-- =====================================================================
-- 7. SCHOOL_SETTINGS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  language_default text NOT NULL DEFAULT 'fr',
  timezone text NOT NULL DEFAULT 'Africa/Tunis',
  attendance_required_percentage integer NOT NULL DEFAULT 75,
  passing_score numeric NOT NULL DEFAULT 60,
  allow_self_registration boolean NOT NULL DEFAULT false,
  require_admin_approval boolean NOT NULL DEFAULT true,
  teacher_can_create_exam boolean NOT NULL DEFAULT true,
  teacher_can_create_content boolean NOT NULL DEFAULT true,
  student_can_join_by_code boolean NOT NULL DEFAULT true,
  auto_certificate boolean NOT NULL DEFAULT false,
  certificate_template_id uuid,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_settings TO authenticated;
GRANT ALL ON public.school_settings TO service_role;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings read by members" ON public.school_settings;
CREATE POLICY "settings read by members" ON public.school_settings
  FOR SELECT TO authenticated
  USING (public.is_school_member(school_id, auth.uid()));

DROP POLICY IF EXISTS "settings write by owner/admin" ON public.school_settings;
CREATE POLICY "settings write by owner/admin" ON public.school_settings
  FOR ALL TO authenticated
  USING (public.is_school_owner(school_id, auth.uid()))
  WITH CHECK (public.is_school_owner(school_id, auth.uid()));

CREATE TRIGGER trg_school_settings_updated_at
  BEFORE UPDATE ON public.school_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- 8. SCHOOL_RULES (free JSON rules per school)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.school_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  rule_key text NOT NULL,
  rule_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, rule_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_rules TO authenticated;
GRANT ALL ON public.school_rules TO service_role;
ALTER TABLE public.school_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rules read by members" ON public.school_rules;
CREATE POLICY "rules read by members" ON public.school_rules
  FOR SELECT TO authenticated
  USING (public.is_school_member(school_id, auth.uid()));

DROP POLICY IF EXISTS "rules write by owner" ON public.school_rules;
CREATE POLICY "rules write by owner" ON public.school_rules
  FOR ALL TO authenticated
  USING (public.is_school_owner(school_id, auth.uid()))
  WITH CHECK (public.is_school_owner(school_id, auth.uid()));

CREATE TRIGGER trg_school_rules_updated_at
  BEFORE UPDATE ON public.school_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- 9. Trigger schools.updated_at
-- =====================================================================
DROP TRIGGER IF EXISTS trg_schools_updated_at ON public.schools;
CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
