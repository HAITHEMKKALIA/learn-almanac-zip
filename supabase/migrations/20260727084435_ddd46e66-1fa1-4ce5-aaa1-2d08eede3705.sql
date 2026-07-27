-- Strict tenant isolation and platform-owner approval workflow.
ALTER TABLE public.school_members
  ADD COLUMN IF NOT EXISTS space_role public.app_role,
  ADD COLUMN IF NOT EXISTS requested_class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

UPDATE public.school_members sm
SET space_role = CASE
  WHEN s.tenant_type = 'independent_teacher' AND sm.role = 'owner' THEN 'teacher'::public.app_role
  WHEN s.tenant_type = 'independent_student' AND sm.role = 'owner' THEN 'student'::public.app_role
  WHEN sm.role = 'owner' THEN 'school_admin'::public.app_role
  WHEN sm.role = 'teacher' THEN 'teacher'::public.app_role
  ELSE 'student'::public.app_role
END
FROM public.schools s
WHERE s.id = sm.school_id
  AND sm.space_role IS NULL;

INSERT INTO public.user_roles(user_id, role)
SELECT DISTINCT sm.user_id, sm.space_role
FROM public.school_members sm
WHERE sm.space_role IS NOT NULL
  AND sm.status = 'approved'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_school_members_active_lookup
  ON public.school_members (school_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_school_members_space_role
  ON public.school_members (school_id, space_role, status);

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN _role = 'admin'::public.app_role THEN public.is_super_admin(_user_id)
    ELSE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = _role)
  END
$$;

CREATE OR REPLACE FUNCTION public.is_school_member(_school_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.school_members sm
      JOIN public.schools s ON s.id = sm.school_id
      JOIN public.profiles p ON p.user_id = sm.user_id
      WHERE sm.school_id = _school_id AND sm.user_id = _user_id
        AND sm.status = 'approved' AND s.status = 'active' AND COALESCE(p.approved, false)
    )
$$;

CREATE OR REPLACE FUNCTION public.is_school_owner(_school_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.school_members sm
      JOIN public.schools s ON s.id = sm.school_id
      JOIN public.profiles p ON p.user_id = sm.user_id
      WHERE sm.school_id = _school_id AND sm.user_id = _user_id
        AND sm.status = 'approved' AND s.status = 'active' AND COALESCE(p.approved, false)
        AND (sm.role = 'owner'::public.school_role OR sm.space_role = 'school_admin'::public.app_role)
    )
$$;

CREATE OR REPLACE FUNCTION public.is_school_teacher(_school_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.school_members sm
      JOIN public.schools s ON s.id = sm.school_id
      JOIN public.profiles p ON p.user_id = sm.user_id
      WHERE sm.school_id = _school_id AND sm.user_id = _user_id
        AND sm.status = 'approved' AND s.status = 'active' AND COALESCE(p.approved, false)
        AND (
          sm.role IN ('owner'::public.school_role, 'teacher'::public.school_role)
          OR sm.space_role IN (
            'school_admin'::public.app_role,'academic_director'::public.app_role,
            'pedagogical_coordinator'::public.app_role,'examiner'::public.app_role,
            'teacher'::public.app_role,'staff'::public.app_role
          )
        )
    )
$$;

CREATE OR REPLACE FUNCTION public.has_school_role(_school_id uuid, _user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.school_members sm
      JOIN public.schools s ON s.id = sm.school_id
      JOIN public.profiles p ON p.user_id = sm.user_id
      WHERE sm.school_id = _school_id AND sm.user_id = _user_id
        AND sm.status = 'approved' AND s.status = 'active' AND COALESCE(p.approved, false)
        AND sm.space_role = ANY(_roles)
    )
$$;

CREATE OR REPLACE FUNCTION public.is_independent_teacher_owner(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.schools s
      JOIN public.school_members sm ON sm.school_id = s.id AND sm.user_id = _user_id
      JOIN public.profiles p ON p.user_id = _user_id
      WHERE s.id = _school_id AND s.owner_id = _user_id
        AND s.tenant_type = 'independent_teacher' AND s.status = 'active'
        AND sm.status = 'approved' AND COALESCE(p.approved, false)
    )
$$;

CREATE OR REPLACE FUNCTION public.is_independent_student_owner(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.schools s
      JOIN public.school_members sm ON sm.school_id = s.id AND sm.user_id = _user_id
      JOIN public.profiles p ON p.user_id = _user_id
      WHERE s.id = _school_id AND s.owner_id = _user_id
        AND s.tenant_type = 'independent_student' AND s.status = 'active'
        AND sm.status = 'approved' AND COALESCE(p.approved, false)
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_learning_space(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.is_school_member(_school_id, _user_id) $$;

CREATE OR REPLACE FUNCTION public.can_manage_learning_space(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR public.is_school_owner(_school_id, _user_id)
    OR public.is_independent_teacher_owner(_user_id, _school_id)
    OR public.is_independent_student_owner(_user_id, _school_id)
$$;

CREATE OR REPLACE FUNCTION public.users_share_school(_left_user uuid, _right_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_left_user)
    OR _left_user = _right_user
    OR EXISTS (
      SELECT 1 FROM public.school_members viewer
      JOIN public.school_members target ON target.school_id = viewer.school_id
      JOIN public.schools s ON s.id = viewer.school_id
      JOIN public.profiles vp ON vp.user_id = viewer.user_id
      JOIN public.profiles tp ON tp.user_id = target.user_id
      WHERE viewer.user_id = _left_user AND target.user_id = _right_user
        AND viewer.status = 'approved' AND target.status = 'approved'
        AND s.status = 'active'
        AND COALESCE(vp.approved, false) AND COALESCE(tp.approved, false)
    )
$$;

CREATE OR REPLACE FUNCTION public.teacher_can_view_student(_teacher uuid, _student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_teacher)
    OR EXISTS (
      SELECT 1 FROM public.class_members cm
      JOIN public.classes c ON c.id = cm.class_id
      WHERE cm.student_id = _student
        AND (
          c.teacher_id = _teacher
          OR public.is_school_owner(c.school_id, _teacher)
          OR EXISTS (SELECT 1 FROM public.teacher_assignments ta WHERE ta.class_id = c.id AND ta.teacher_id = _teacher)
        )
        AND public.is_school_member(c.school_id, _teacher)
        AND public.is_school_member(c.school_id, _student)
    )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_school_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_school_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_school_teacher(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_school_role(uuid, uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_independent_teacher_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_independent_student_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_learning_space(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_learning_space(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.users_share_school(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teacher_can_view_student(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_school_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_school_owner(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_school_teacher(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_school_role(uuid, uuid, public.app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_independent_teacher_owner(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_independent_student_owner(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_learning_space(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_learning_space(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.users_share_school(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teacher_can_view_student(uuid, uuid) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.my_learning_spaces();
CREATE FUNCTION public.my_learning_spaces()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, role text, tenant_type text, is_independent boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT ON (s.id)
    s.id, s.name, s.slug, s.logo_url,
    CASE
      WHEN s.tenant_type = 'independent_teacher' THEN 'teacher'
      WHEN s.tenant_type = 'independent_student' THEN 'student'
      WHEN sm.role = 'owner'::public.school_role THEN 'school_admin'
      ELSE COALESCE(sm.space_role::text, sm.role::text)
    END AS role,
    s.tenant_type, s.is_independent
  FROM public.schools s
  JOIN public.school_members sm ON sm.school_id = s.id
  JOIN public.profiles p ON p.user_id = sm.user_id
  WHERE sm.user_id = auth.uid()
    AND sm.status = 'approved' AND s.status = 'active' AND COALESCE(p.approved, false)
  ORDER BY s.id,
    CASE COALESCE(sm.space_role::text, sm.role::text)
      WHEN 'school_admin' THEN 1 WHEN 'owner' THEN 1
      WHEN 'academic_director' THEN 2 WHEN 'pedagogical_coordinator' THEN 3
      WHEN 'teacher' THEN 4 WHEN 'examiner' THEN 5
      WHEN 'parent' THEN 6 ELSE 7 END;
$$;

DROP FUNCTION IF EXISTS public.my_schools();
CREATE FUNCTION public.my_schools()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ls.id, ls.name, ls.slug, ls.logo_url, ls.role
  FROM public.my_learning_spaces() ls
  WHERE ls.tenant_type = 'school'
  ORDER BY ls.name;
$$;

CREATE OR REPLACE FUNCTION public.my_pending_space_requests()
RETURNS TABLE(id uuid, name text, tenant_type text, school_status text, membership_status text, requested_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.name, s.tenant_type, s.status, sm.status, sm.joined_at
  FROM public.school_members sm
  JOIN public.schools s ON s.id = sm.school_id
  WHERE sm.user_id = auth.uid()
    AND (sm.status = 'pending' OR s.status = 'pending')
  ORDER BY sm.joined_at DESC;
$$;

REVOKE ALL ON FUNCTION public.my_learning_spaces() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_schools() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_pending_space_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_learning_spaces() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_schools() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_pending_space_requests() TO authenticated, service_role;

DO $$
DECLARE policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('schools','school_members','classes','class_members','direct_messages','user_presence','subscriptions','audit_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  END LOOP;
END $$;

CREATE POLICY schools_select_isolated ON public.schools FOR SELECT TO authenticated
USING (public.is_super_admin((SELECT auth.uid())) OR public.is_school_member(id, (SELECT auth.uid())) OR owner_id = (SELECT auth.uid()));
CREATE POLICY schools_insert_platform_only ON public.schools FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY schools_update_platform_or_active_owner ON public.schools FOR UPDATE TO authenticated
USING (public.is_super_admin((SELECT auth.uid())) OR public.is_school_owner(id, (SELECT auth.uid())))
WITH CHECK (public.is_super_admin((SELECT auth.uid())) OR (public.is_school_owner(id, (SELECT auth.uid())) AND status = 'active'));
CREATE POLICY schools_delete_platform_only ON public.schools FOR DELETE TO authenticated
USING (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY memberships_select_isolated ON public.school_members FOR SELECT TO authenticated
USING (public.is_super_admin((SELECT auth.uid())) OR user_id = (SELECT auth.uid()) OR public.is_school_teacher(school_id, (SELECT auth.uid())));
CREATE POLICY memberships_request_self ON public.school_members FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'pending' AND approved_by IS NULL AND approved_at IS NULL);
CREATE POLICY memberships_invite_pending ON public.school_members FOR INSERT TO authenticated
WITH CHECK (public.is_school_owner(school_id, (SELECT auth.uid())) AND status = 'pending' AND approved_by IS NULL AND approved_at IS NULL);
CREATE POLICY memberships_review_platform_only ON public.school_members FOR UPDATE TO authenticated
USING (public.is_super_admin((SELECT auth.uid()))) WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY memberships_delete_self_or_manager ON public.school_members FOR DELETE TO authenticated
USING (public.is_super_admin((SELECT auth.uid())) OR user_id = (SELECT auth.uid()) OR public.is_school_owner(school_id, (SELECT auth.uid())));

CREATE POLICY classes_select_isolated ON public.classes FOR SELECT TO authenticated
USING (
  public.is_super_admin((SELECT auth.uid()))
  OR (public.is_school_member(school_id, (SELECT auth.uid()))
    AND (
      public.is_school_teacher(school_id, (SELECT auth.uid()))
      OR teacher_id = (SELECT auth.uid())
      OR EXISTS (SELECT 1 FROM public.teacher_assignments ta WHERE ta.class_id = classes.id AND ta.teacher_id = (SELECT auth.uid()))
      OR EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = classes.id AND cm.student_id = (SELECT auth.uid()))
    )
  )
);
CREATE POLICY classes_insert_isolated ON public.classes FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin((SELECT auth.uid()))
  OR (public.is_school_teacher(school_id, (SELECT auth.uid()))
    AND (teacher_id = (SELECT auth.uid()) OR public.is_school_owner(school_id, (SELECT auth.uid())))));
CREATE POLICY classes_update_isolated ON public.classes FOR UPDATE TO authenticated
USING (public.is_super_admin((SELECT auth.uid())) OR teacher_id = (SELECT auth.uid()) OR public.is_school_owner(school_id, (SELECT auth.uid())))
WITH CHECK (public.is_super_admin((SELECT auth.uid()))
  OR (public.is_school_teacher(school_id, (SELECT auth.uid()))
    AND (teacher_id = (SELECT auth.uid()) OR public.is_school_owner(school_id, (SELECT auth.uid())))));
CREATE POLICY classes_delete_isolated ON public.classes FOR DELETE TO authenticated
USING (public.is_super_admin((SELECT auth.uid())) OR teacher_id = (SELECT auth.uid()) OR public.is_school_owner(school_id, (SELECT auth.uid())));

CREATE POLICY class_members_select_isolated ON public.class_members FOR SELECT TO authenticated
USING (student_id = (SELECT auth.uid()) OR EXISTS (
  SELECT 1 FROM public.classes c WHERE c.id = class_members.class_id
    AND (public.is_super_admin((SELECT auth.uid())) OR c.teacher_id = (SELECT auth.uid()) OR public.is_school_teacher(c.school_id, (SELECT auth.uid())))
));
CREATE POLICY class_members_insert_isolated ON public.class_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.classes c WHERE c.id = class_members.class_id
    AND public.is_school_member(c.school_id, class_members.student_id)
    AND (public.is_super_admin((SELECT auth.uid())) OR c.teacher_id = (SELECT auth.uid()) OR public.is_school_owner(c.school_id, (SELECT auth.uid())))
));
CREATE POLICY class_members_delete_isolated ON public.class_members FOR DELETE TO authenticated
USING (student_id = (SELECT auth.uid()) OR EXISTS (
  SELECT 1 FROM public.classes c WHERE c.id = class_members.class_id
    AND (public.is_super_admin((SELECT auth.uid())) OR c.teacher_id = (SELECT auth.uid()) OR public.is_school_owner(c.school_id, (SELECT auth.uid())))
));

CREATE POLICY messages_select_participants_same_tenant ON public.direct_messages FOR SELECT TO authenticated
USING ((sender_id = (SELECT auth.uid()) OR recipient_id = (SELECT auth.uid())) AND public.users_share_school(sender_id, recipient_id));
CREATE POLICY messages_insert_same_tenant ON public.direct_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = (SELECT auth.uid()) AND public.is_approved((SELECT auth.uid())) AND public.users_share_school(sender_id, recipient_id));
CREATE POLICY messages_update_recipient ON public.direct_messages FOR UPDATE TO authenticated
USING (recipient_id = (SELECT auth.uid()) AND public.users_share_school(sender_id, recipient_id))
WITH CHECK (recipient_id = (SELECT auth.uid()) AND public.users_share_school(sender_id, recipient_id));

CREATE POLICY presence_manage_self ON public.user_presence FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY presence_select_shared_tenant ON public.user_presence FOR SELECT TO authenticated
USING (public.users_share_school((SELECT auth.uid()), user_id));

CREATE POLICY subscriptions_select_owner_only ON public.subscriptions FOR SELECT TO authenticated
USING (public.is_super_admin((SELECT auth.uid())) OR owner_user_id = (SELECT auth.uid())
  OR (school_id IS NOT NULL AND public.is_school_owner(school_id, (SELECT auth.uid()))));
CREATE POLICY subscriptions_platform_manage ON public.subscriptions FOR ALL TO authenticated
USING (public.is_super_admin((SELECT auth.uid()))) WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE POLICY audit_select_isolated ON public.audit_logs FOR SELECT TO authenticated
USING (actor_id = (SELECT auth.uid()) OR public.is_super_admin((SELECT auth.uid()))
  OR (school_id IS NOT NULL AND public.is_school_owner(school_id, (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin reads all consent" ON public.consent_logs;

CREATE POLICY profiles_platform_select ON public.profiles FOR SELECT TO authenticated USING (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY profiles_platform_update ON public.profiles FOR UPDATE TO authenticated USING (public.is_super_admin((SELECT auth.uid()))) WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY profiles_platform_delete ON public.profiles FOR DELETE TO authenticated USING (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY roles_platform_manage ON public.user_roles FOR ALL TO authenticated USING (public.is_super_admin((SELECT auth.uid()))) WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY consent_platform_select ON public.consent_logs FOR SELECT TO authenticated USING (public.is_super_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "kapitel write" ON public.kapitel;
DROP POLICY IF EXISTS "kapitel_sections write" ON public.kapitel_sections;
DROP POLICY IF EXISTS "vocab_themes write" ON public.vocab_themes;
DROP POLICY IF EXISTS "vocab_entries write" ON public.vocab_entries;
CREATE POLICY kapitel_platform_write ON public.kapitel FOR ALL TO authenticated USING (public.is_super_admin((SELECT auth.uid()))) WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY kapitel_sections_platform_write ON public.kapitel_sections FOR ALL TO authenticated USING (public.is_super_admin((SELECT auth.uid()))) WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY vocab_themes_platform_write ON public.vocab_themes FOR ALL TO authenticated USING (public.is_super_admin((SELECT auth.uid()))) WITH CHECK (public.is_super_admin((SELECT auth.uid())));
CREATE POLICY vocab_entries_platform_write ON public.vocab_entries FOR ALL TO authenticated USING (public.is_super_admin((SELECT auth.uid()))) WITH CHECK (public.is_super_admin((SELECT auth.uid())));

CREATE OR REPLACE FUNCTION public.enforce_school_tenant_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _new_school_id uuid; _old_school_id uuid;
BEGIN
  IF _uid IS NULL OR public.is_super_admin(_uid) THEN RETURN NEW; END IF;
  _new_school_id := NULLIF(to_jsonb(NEW)->>'school_id', '')::uuid;
  IF TG_OP = 'UPDATE' THEN
    _old_school_id := NULLIF(to_jsonb(OLD)->>'school_id', '')::uuid;
    IF _old_school_id IS DISTINCT FROM _new_school_id THEN
      RAISE EXCEPTION 'tenant_change_forbidden' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF _new_school_id IS NULL THEN
    RAISE EXCEPTION 'school_id_required' USING ERRCODE = '42501';
  END IF;
  IF TG_TABLE_NAME = 'school_members' AND to_jsonb(NEW)->>'user_id' = _uid::text AND to_jsonb(NEW)->>'status' = 'pending' THEN
    RETURN NEW;
  END IF;
  IF NOT public.is_school_member(_new_school_id, _uid)
     AND NOT EXISTS (SELECT 1 FROM public.schools s WHERE s.id = _new_school_id AND s.owner_id = _uid) THEN
    RAISE EXCEPTION 'cross_tenant_write_forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.enforce_school_tenant_write() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_school_tenant_write() TO service_role;

DO $$
DECLARE table_record record;
BEGIN
  FOR table_record IN
    SELECT DISTINCT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public' AND c.column_name = 'school_id' AND t.table_type = 'BASE TABLE'
      AND c.table_name NOT IN ('schools','audit_logs')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS enforce_school_tenant_write ON public.%I', table_record.table_name);
    EXECUTE format('CREATE TRIGGER enforce_school_tenant_write BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_school_tenant_write()', table_record.table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.admin_pending_profiles()
RETURNS TABLE(user_id uuid, display_name text, email text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT p.user_id, p.display_name, p.email, p.created_at FROM public.profiles p WHERE p.approved = false ORDER BY p.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_pending_members()
RETURNS TABLE(id uuid, school_id uuid, user_id uuid, role text, status text, joined_at timestamptz, school_name text, display_name text, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT sm.id, sm.school_id, sm.user_id, COALESCE(sm.space_role::text, sm.role::text), sm.status, sm.joined_at, s.name, p.display_name, p.email
  FROM public.school_members sm
  JOIN public.schools s ON s.id = sm.school_id
  LEFT JOIN public.profiles p ON p.user_id = sm.user_id
  WHERE sm.status = 'pending' AND s.status = 'active'
  ORDER BY sm.joined_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_pending_schools()
RETURNS TABLE(id uuid, name text, tenant_type text, owner_id uuid, owner_name text, owner_email text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.name, s.tenant_type, s.owner_id, p.display_name, p.email, s.created_at
  FROM public.schools s LEFT JOIN public.profiles p ON p.user_id = s.owner_id
  WHERE s.status = 'pending' ORDER BY s.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.platform_review_school(_school_id uuid, _decision text, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE _owner_id uuid; _new_status text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501'; END IF;
  IF _decision NOT IN ('approve','reject','suspend','archive') THEN RAISE EXCEPTION 'invalid_decision'; END IF;
  _new_status := CASE _decision WHEN 'approve' THEN 'active' WHEN 'reject' THEN 'archived' WHEN 'suspend' THEN 'suspended' ELSE 'archived' END;
  UPDATE public.schools SET status = _new_status, review_reason = NULLIF(trim(_reason), ''), reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  WHERE id = _school_id RETURNING owner_id INTO _owner_id;
  IF _owner_id IS NULL THEN RAISE EXCEPTION 'school_not_found'; END IF;
  IF _decision = 'approve' THEN
    UPDATE public.school_members SET status = 'approved', approved_by = auth.uid(), approved_at = now(), reviewed_at = now(), review_reason = NULL
      WHERE school_id = _school_id AND user_id = _owner_id;
    UPDATE public.profiles SET approved = true, updated_at = now() WHERE user_id = _owner_id;
    INSERT INTO public.user_roles(user_id, role)
    SELECT _owner_id, CASE s.tenant_type
      WHEN 'independent_teacher' THEN 'teacher'::public.app_role
      WHEN 'independent_student' THEN 'student'::public.app_role
      ELSE 'school_admin'::public.app_role END
    FROM public.schools s WHERE s.id = _school_id
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    UPDATE public.school_members SET status = CASE WHEN _decision = 'suspend' THEN 'suspended' ELSE 'rejected' END,
      reviewed_at = now(), review_reason = NULLIF(trim(_reason), '')
    WHERE school_id = _school_id;
  END IF;
  INSERT INTO public.audit_logs(actor_id, action, target_table, target_id, school_id, metadata)
  VALUES (auth.uid(), 'platform.review_school', 'schools', _school_id, _school_id, jsonb_build_object('decision', _decision, 'reason', _reason));
END; $$;

CREATE OR REPLACE FUNCTION public.platform_review_membership(_membership_id uuid, _decision text, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE _membership public.school_members%ROWTYPE; _school_status text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501'; END IF;
  IF _decision NOT IN ('approve','reject','suspend') THEN RAISE EXCEPTION 'invalid_decision'; END IF;
  SELECT * INTO _membership FROM public.school_members WHERE id = _membership_id;
  IF _membership.id IS NULL THEN RAISE EXCEPTION 'membership_not_found'; END IF;
  SELECT status INTO _school_status FROM public.schools WHERE id = _membership.school_id;
  IF _decision = 'approve' AND _school_status <> 'active' THEN RAISE EXCEPTION 'school_must_be_active_before_member_approval'; END IF;
  UPDATE public.school_members
  SET status = CASE _decision WHEN 'approve' THEN 'approved' WHEN 'suspend' THEN 'suspended' ELSE 'rejected' END,
    approved_by = CASE WHEN _decision = 'approve' THEN auth.uid() ELSE approved_by END,
    approved_at = CASE WHEN _decision = 'approve' THEN now() ELSE approved_at END,
    reviewed_at = now(), review_reason = NULLIF(trim(_reason), '')
  WHERE id = _membership_id;
  IF _decision = 'approve' THEN
    UPDATE public.profiles SET approved = true, updated_at = now() WHERE user_id = _membership.user_id;
    IF _membership.space_role IS NOT NULL THEN
      INSERT INTO public.user_roles(user_id, role) VALUES (_membership.user_id, _membership.space_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    IF _membership.requested_class_id IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = _membership.requested_class_id AND c.school_id = _membership.school_id) THEN
      INSERT INTO public.class_members(class_id, student_id) VALUES (_membership.requested_class_id, _membership.user_id)
      ON CONFLICT (class_id, student_id) DO NOTHING;
    END IF;
  END IF;
  INSERT INTO public.audit_logs(actor_id, action, target_table, target_id, school_id, metadata)
  VALUES (auth.uid(), 'platform.review_membership', 'school_members', _membership_id, _membership.school_id,
    jsonb_build_object('decision', _decision, 'reason', _reason, 'user_id', _membership.user_id));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_assign_user(_target uuid, _school_id uuid, _role public.app_role, _class_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE _legacy_role public.school_role; _space_role public.app_role; _member_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.schools WHERE id = _school_id AND status = 'active') THEN RAISE EXCEPTION 'active_school_required'; END IF;
  IF _role = 'super_admin'::public.app_role THEN RAISE EXCEPTION 'super_admin_assignment_forbidden'; END IF;
  _space_role := CASE WHEN _role = 'admin'::public.app_role THEN 'school_admin'::public.app_role ELSE _role END;
  _legacy_role := CASE WHEN _space_role IN ('school_admin'::public.app_role,'academic_director'::public.app_role,'pedagogical_coordinator'::public.app_role,'examiner'::public.app_role,'teacher'::public.app_role,'staff'::public.app_role)
    THEN 'teacher'::public.school_role ELSE 'student'::public.school_role END;
  UPDATE public.profiles SET approved = true, updated_at = now() WHERE user_id = _target;
  INSERT INTO public.user_roles(user_id, role) VALUES (_target, _space_role) ON CONFLICT (user_id, role) DO NOTHING;
  SELECT id INTO _member_id FROM public.school_members WHERE school_id = _school_id AND user_id = _target ORDER BY joined_at LIMIT 1;
  IF _member_id IS NULL THEN
    INSERT INTO public.school_members(school_id, user_id, role, space_role, status, approved_by, approved_at, requested_class_id)
    VALUES (_school_id, _target, _legacy_role, _space_role, 'approved', auth.uid(), now(), _class_id)
    RETURNING id INTO _member_id;
  ELSE
    UPDATE public.school_members SET role = _legacy_role, space_role = _space_role, status = 'approved',
      approved_by = auth.uid(), approved_at = now(), reviewed_at = now(),
      requested_class_id = COALESCE(_class_id, requested_class_id), review_reason = NULL
    WHERE id = _member_id;
  END IF;
  IF _class_id IS NOT NULL AND _space_role = 'student'::public.app_role THEN
    IF NOT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND school_id = _school_id) THEN RAISE EXCEPTION 'class_not_in_school'; END IF;
    INSERT INTO public.class_members(class_id, student_id) VALUES (_class_id, _target)
    ON CONFLICT (class_id, student_id) DO NOTHING;
  END IF;
  INSERT INTO public.audit_logs(actor_id, action, target_table, target_id, school_id, metadata)
  VALUES (auth.uid(), 'platform.assign_user', 'school_members', _member_id, _school_id,
    jsonb_build_object('user_id', _target, 'role', _space_role, 'class_id', _class_id));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_approved(_target uuid, _approved boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'platform_owner_required' USING ERRCODE = '42501'; END IF;
  UPDATE public.profiles SET approved = _approved, updated_at = now() WHERE user_id = _target;
  INSERT INTO public.audit_logs(actor_id, action, target_table, target_id, metadata)
  VALUES (auth.uid(), 'platform.review_profile', 'profiles', _target, jsonb_build_object('approved', _approved));
END; $$;

CREATE OR REPLACE FUNCTION public.school_members_full(_school_id uuid)
RETURNS TABLE(user_id uuid, display_name text, email text, approved boolean, school_role public.school_role, app_roles text[], classes text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_super_admin(auth.uid()) OR public.is_school_teacher(_school_id, auth.uid())) THEN
    RAISE EXCEPTION 'school_access_required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT sm.user_id, p.display_name, p.email,
    (COALESCE(p.approved, false) AND sm.status = 'approved' AND s.status = 'active') AS approved,
    sm.role,
    CASE WHEN sm.space_role IS NULL THEN ARRAY[sm.role::text] ELSE ARRAY[sm.space_role::text] END AS app_roles,
    COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}'::text[]) AS classes
  FROM public.school_members sm
  JOIN public.schools s ON s.id = sm.school_id
  LEFT JOIN public.profiles p ON p.user_id = sm.user_id
  LEFT JOIN public.class_members cm ON cm.student_id = sm.user_id
  LEFT JOIN public.classes c ON c.id = cm.class_id AND c.school_id = _school_id
  WHERE sm.school_id = _school_id
  GROUP BY sm.id, sm.user_id, p.display_name, p.email, p.approved, sm.status, sm.role, sm.space_role, s.status
  ORDER BY p.display_name NULLS LAST;
END; $$;

CREATE OR REPLACE FUNCTION public.school_assign_student_to_class(_school_id uuid, _target uuid, _class_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_super_admin(auth.uid()) OR public.is_school_owner(_school_id, auth.uid())) THEN
    RAISE EXCEPTION 'school_manager_required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_school_member(_school_id, _target) THEN RAISE EXCEPTION 'approved_school_member_required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.classes c WHERE c.id = _class_id AND c.school_id = _school_id) THEN RAISE EXCEPTION 'class_not_in_school'; END IF;
  INSERT INTO public.class_members(class_id, student_id) VALUES (_class_id, _target) ON CONFLICT (class_id, student_id) DO NOTHING;
  INSERT INTO public.audit_logs(actor_id, action, target_table, target_id, school_id, metadata)
  VALUES (auth.uid(), 'school.assign_student_to_class', 'classes', _class_id, _school_id, jsonb_build_object('student_id', _target));
END; $$;

REVOKE ALL ON FUNCTION public.admin_pending_profiles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_pending_members() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_pending_schools() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.platform_review_school(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.platform_review_membership(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_assign_user(uuid, uuid, public.app_role, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_approved(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.school_members_full(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.school_assign_student_to_class(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pending_profiles() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_pending_members() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_pending_schools() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_review_school(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_review_membership(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_assign_user(uuid, uuid, public.app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_approved(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.school_members_full(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.school_assign_student_to_class(uuid, uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_school_space(_school_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE _uid uuid := auth.uid(); _school_id uuid; _name text; _slug text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.is_approved(_uid) THEN RAISE EXCEPTION 'profile_approval_required'; END IF;
  _name := NULLIF(trim(_school_name), '');
  IF _name IS NULL OR length(_name) < 3 THEN RAISE EXCEPTION 'school_name_required'; END IF;
  IF EXISTS (SELECT 1 FROM public.schools s WHERE s.owner_id = _uid AND s.status = 'pending' AND s.tenant_type = 'school') THEN
    RAISE EXCEPTION 'school_request_already_pending';
  END IF;
  _slug := lower(regexp_replace(_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  INSERT INTO public.schools(name, slug, owner_id, status, tenant_type, is_independent)
  VALUES (_name, _slug, _uid, 'pending', 'school', false) RETURNING id INTO _school_id;
  INSERT INTO public.school_members(school_id, user_id, role, space_role, status)
  VALUES (_school_id, _uid, 'owner'::public.school_role, 'school_admin'::public.app_role, 'pending');
  RETURN _school_id;
END; $$;

CREATE OR REPLACE FUNCTION public.create_independent_teacher_space(_studio_name text, _display_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE _uid uuid := auth.uid(); _school_id uuid; _slug text; _name text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.is_approved(_uid) THEN RAISE EXCEPTION 'profile_approval_required'; END IF;
  IF EXISTS (SELECT 1 FROM public.schools WHERE owner_id = _uid AND tenant_type = 'independent_teacher' AND status IN ('pending','active')) THEN
    RAISE EXCEPTION 'teacher_space_already_exists';
  END IF;
  _name := COALESCE(NULLIF(trim(_studio_name), ''), 'Mon Studio');
  _slug := lower(regexp_replace(_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  INSERT INTO public.schools(name, slug, owner_id, status, tenant_type, is_independent, legal_name)
  VALUES (_name, _slug, _uid, 'pending', 'independent_teacher', true, COALESCE(NULLIF(trim(_display_name), ''), _name))
  RETURNING id INTO _school_id;
  INSERT INTO public.school_members(school_id, user_id, role, space_role, status)
  VALUES (_school_id, _uid, 'owner'::public.school_role, 'teacher'::public.app_role, 'pending');
  INSERT INTO public.teacher_studio_settings(school_id, teacher_id, studio_name)
  VALUES (_school_id, _uid, _name) ON CONFLICT (school_id) DO NOTHING;
  RETURN _school_id;
END; $$;

CREATE OR REPLACE FUNCTION public.create_independent_student_space(_current_level text DEFAULT 'A1.1')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE _uid uuid := auth.uid(); _school_id uuid; _slug text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.is_approved(_uid) THEN RAISE EXCEPTION 'profile_approval_required'; END IF;
  IF EXISTS (SELECT 1 FROM public.schools WHERE owner_id = _uid AND tenant_type = 'independent_student' AND status IN ('pending','active')) THEN
    RAISE EXCEPTION 'student_space_already_exists';
  END IF;
  _slug := 'solo-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  INSERT INTO public.schools(name, slug, owner_id, status, tenant_type, is_independent)
  VALUES ('Apprentissage personnel', _slug, _uid, 'pending', 'independent_student', true) RETURNING id INTO _school_id;
  INSERT INTO public.school_members(school_id, user_id, role, space_role, status)
  VALUES (_school_id, _uid, 'student'::public.school_role, 'student'::public.app_role, 'pending');
  INSERT INTO public.solo_student_settings(school_id, student_id, current_level)
  VALUES (_school_id, _uid, COALESCE(NULLIF(trim(_current_level), ''), 'A1.1'))
  ON CONFLICT (school_id) DO NOTHING;
  RETURN _school_id;
END; $$;

CREATE OR REPLACE FUNCTION public.join_class_by_code(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE _uid uuid := auth.uid(); _class_id uuid; _school_id uuid; _clean_code text := upper(trim(COALESCE(_code, '')));
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.is_approved(_uid) THEN RAISE EXCEPTION 'profile_approval_required'; END IF;
  IF _clean_code = '' THEN RAISE EXCEPTION 'invalid_code'; END IF;
  SELECT c.id, c.school_id INTO _class_id, _school_id
  FROM public.classes c JOIN public.schools s ON s.id = c.school_id
  WHERE upper(c.invite_code) = _clean_code AND c.status IN ('open','active') AND s.status = 'active' LIMIT 1;
  IF _class_id IS NULL THEN RAISE EXCEPTION 'invalid_code'; END IF;
  INSERT INTO public.school_members(school_id, user_id, role, space_role, status, requested_class_id)
  VALUES (_school_id, _uid, 'student'::public.school_role, 'student'::public.app_role, 'pending', _class_id)
  ON CONFLICT (school_id, user_id, role) DO UPDATE SET
    status = 'pending', requested_class_id = EXCLUDED.requested_class_id, reviewed_at = NULL, review_reason = NULL;
  RETURN _class_id;
END; $$;

REVOKE ALL ON FUNCTION public.request_school_space(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_independent_teacher_space(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_independent_student_space(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_class_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_school_space(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_independent_teacher_space(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_independent_student_space(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.record_my_legal_consent(_terms_version text, _privacy_version text, _user_agent text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _terms_version <> '2.0' OR _privacy_version <> '2.0' THEN RAISE EXCEPTION 'outdated_legal_version'; END IF;
  INSERT INTO public.consent_logs(user_id, consent_type, granted, version, user_agent, metadata)
  VALUES (_uid, 'terms', true, _terms_version, _user_agent, jsonb_build_object('source', 'legal_gate')),
         (_uid, 'privacy', true, _privacy_version, _user_agent, jsonb_build_object('source', 'legal_gate'));
  UPDATE public.profiles SET terms_accepted_at = now(), privacy_accepted_at = now(), updated_at = now() WHERE user_id = _uid;
END; $$;

REVOKE ALL ON FUNCTION public.record_my_legal_consent(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_my_legal_consent(text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE _is_platform_owner boolean := lower(NEW.email) = 'haithem.kalia@gmail.com';
  _terms_version text := NEW.raw_user_meta_data->>'terms_version';
  _privacy_version text := NEW.raw_user_meta_data->>'privacy_version';
BEGIN
  INSERT INTO public.profiles(user_id, display_name, email, approved, birth_year, is_minor, guardian_email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email, _is_platform_owner,
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'birth_year','') ~ '^[0-9]{4}$'
      THEN (NEW.raw_user_meta_data->>'birth_year')::int ELSE NULL END,
    lower(COALESCE(NEW.raw_user_meta_data->>'is_minor','false')) = 'true',
    NULLIF(NEW.raw_user_meta_data->>'guardian_email',''));
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'student'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  IF _is_platform_owner THEN
    INSERT INTO public.user_roles(user_id, role) VALUES
      (NEW.id, 'super_admin'::public.app_role), (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  IF _terms_version = '2.0' AND _privacy_version = '2.0' THEN
    UPDATE public.profiles SET terms_accepted_at = now(), privacy_accepted_at = now() WHERE user_id = NEW.id;
    INSERT INTO public.consent_logs(user_id, consent_type, granted, version, metadata)
    VALUES (NEW.id, 'terms', true, _terms_version, jsonb_build_object('source', 'signup')),
           (NEW.id, 'privacy', true, _privacy_version, jsonb_build_object('source', 'signup'));
  END IF;
  IF lower(COALESCE(NEW.raw_user_meta_data->>'guardian_consent','false')) = 'true'
     AND NULLIF(NEW.raw_user_meta_data->>'guardian_email','') IS NOT NULL THEN
    INSERT INTO public.consent_logs(user_id, consent_type, granted, version, metadata)
    VALUES (NEW.id, 'guardian_consent', true, '2.0',
      jsonb_build_object('source', 'signup', 'guardian_email', NEW.raw_user_meta_data->>'guardian_email'));
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

GRANT SELECT ON public.schools, public.school_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes, public.class_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_presence TO authenticated;
GRANT SELECT ON public.subscriptions, public.audit_logs TO authenticated;
GRANT SELECT, INSERT ON public.consent_logs TO authenticated;