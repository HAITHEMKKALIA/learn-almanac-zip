
-- 1. Schools table
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_schools_updated
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. School roles enum
CREATE TYPE public.school_role AS ENUM ('owner','teacher','student');

-- 3. School members
CREATE TABLE public.school_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.school_role NOT NULL DEFAULT 'student',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, user_id, role)
);
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_school_members_user ON public.school_members(user_id);
CREATE INDEX idx_school_members_school ON public.school_members(school_id);

-- 4. Helper functions
CREATE OR REPLACE FUNCTION public.is_school_member(_school_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_members WHERE school_id = _school_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_school_teacher(_school_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_members
    WHERE school_id = _school_id AND user_id = _user_id
      AND role IN ('teacher','owner')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_school_owner(_school_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_members WHERE school_id = _school_id AND user_id = _user_id AND role = 'owner')
$$;

-- 5. RLS for schools
CREATE POLICY "Members view their schools" ON public.schools
FOR SELECT TO authenticated
USING (public.is_school_member(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Authenticated create school" ON public.schools
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update school" ON public.schools
FOR UPDATE TO authenticated
USING (public.is_school_owner(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners delete school" ON public.schools
FOR DELETE TO authenticated
USING (public.is_school_owner(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- 6. RLS for school_members
CREATE POLICY "Users view own memberships" ON public.school_members
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "School staff view members" ON public.school_members
FOR SELECT TO authenticated
USING (public.is_school_teacher(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners manage members" ON public.school_members
FOR ALL TO authenticated
USING (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "User joins as student" ON public.school_members
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'student');

CREATE POLICY "User leaves school" ON public.school_members
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 7. Bootstrap: create default school and migrate existing data
DO $$
DECLARE
  _default_school uuid;
  _first_owner uuid;
BEGIN
  -- pick an admin or first user as owner
  SELECT user_id INTO _first_owner FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF _first_owner IS NULL THEN
    SELECT id INTO _first_owner FROM auth.users ORDER BY created_at LIMIT 1;
  END IF;

  IF _first_owner IS NOT NULL THEN
    INSERT INTO public.schools (name, slug, description, owner_id)
    VALUES ('École par défaut', 'ecole-par-defaut', 'École créée automatiquement pour les classes existantes', _first_owner)
    RETURNING id INTO _default_school;

    -- enroll all existing users as members
    INSERT INTO public.school_members (school_id, user_id, role)
    SELECT _default_school, ur.user_id,
      CASE
        WHEN ur.user_id = _first_owner THEN 'owner'::public.school_role
        WHEN ur.role IN ('teacher','admin') THEN 'teacher'::public.school_role
        ELSE 'student'::public.school_role
      END
    FROM (
      SELECT user_id, MAX(role::text) AS role FROM public.user_roles GROUP BY user_id
    ) ur
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 8. Add school_id to classes
ALTER TABLE public.classes ADD COLUMN school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;

-- backfill classes with the default school
UPDATE public.classes SET school_id = (SELECT id FROM public.schools WHERE slug = 'ecole-par-defaut' LIMIT 1)
WHERE school_id IS NULL;

-- ensure all teachers of those classes are school members
INSERT INTO public.school_members (school_id, user_id, role)
SELECT c.school_id, c.teacher_id, 'teacher'::public.school_role
FROM public.classes c
WHERE c.school_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ensure all students in those classes are school members
INSERT INTO public.school_members (school_id, user_id, role)
SELECT c.school_id, cm.student_id, 'student'::public.school_role
FROM public.class_members cm
JOIN public.classes c ON c.id = cm.class_id
WHERE c.school_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- now make required
ALTER TABLE public.classes ALTER COLUMN school_id SET NOT NULL;

-- 9. Update classes RLS: teachers must be members of the school
DROP POLICY IF EXISTS "Teachers manage own classes" ON public.classes;
CREATE POLICY "Teachers manage own classes" ON public.classes
FOR ALL
USING (auth.uid() = teacher_id AND public.is_school_teacher(school_id, auth.uid()))
WITH CHECK (auth.uid() = teacher_id AND public.is_school_teacher(school_id, auth.uid()));

-- 10. Update join_class_by_code to also enroll in school
CREATE OR REPLACE FUNCTION public.join_class_by_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _class_id uuid;
  _school_id uuid;
  _uid uuid := auth.uid();
  _clean_code text := upper(trim(coalesce(_code, '')));
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _clean_code = '' THEN RAISE EXCEPTION 'invalid_code'; END IF;

  SELECT id, school_id INTO _class_id, _school_id
  FROM public.classes WHERE upper(invite_code) = _clean_code LIMIT 1;

  IF _class_id IS NULL THEN RAISE EXCEPTION 'invalid_code'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.school_members (school_id, user_id, role)
  VALUES (_school_id, _uid, 'student')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.class_members (class_id, student_id) VALUES (_class_id, _uid)
  ON CONFLICT (class_id, student_id) DO NOTHING;

  RETURN _class_id;
END;
$$;

-- 11. Promotion function
CREATE OR REPLACE FUNCTION public.promote_students(_student_ids uuid[], _target_class_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _school_id uuid;
  _count integer := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT school_id INTO _school_id FROM public.classes
  WHERE id = _target_class_id AND teacher_id = _uid;
  IF _school_id IS NULL THEN
    RAISE EXCEPTION 'not_authorized_for_target_class';
  END IF;

  -- ensure each student is a school member then add to class
  INSERT INTO public.school_members (school_id, user_id, role)
  SELECT _school_id, s, 'student'::public.school_role
  FROM unnest(_student_ids) AS s
  ON CONFLICT DO NOTHING;

  INSERT INTO public.class_members (class_id, student_id)
  SELECT _target_class_id, s FROM unnest(_student_ids) AS s
  ON CONFLICT (class_id, student_id) DO NOTHING;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- 12. Helper: list schools for current user
CREATE OR REPLACE FUNCTION public.my_schools()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, role public.school_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.name, s.slug, s.logo_url, sm.role
  FROM public.schools s
  JOIN public.school_members sm ON sm.school_id = s.id
  WHERE sm.user_id = auth.uid()
  ORDER BY s.name;
$$;
