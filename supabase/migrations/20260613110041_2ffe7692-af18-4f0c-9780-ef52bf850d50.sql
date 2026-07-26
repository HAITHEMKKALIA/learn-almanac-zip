
-- =========== Levels & sub-levels ===========
CREATE TABLE IF NOT EXISTS public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.levels TO anon, authenticated;
GRANT ALL ON public.levels TO service_role;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "levels_read_all" ON public.levels;
DROP POLICY IF EXISTS "levels_admin_write" ON public.levels;
CREATE POLICY "levels_read_all" ON public.levels FOR SELECT USING (true);
CREATE POLICY "levels_admin_write" ON public.levels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.sub_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  estimated_hours int,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sub_levels TO anon, authenticated;
GRANT ALL ON public.sub_levels TO service_role;
ALTER TABLE public.sub_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_levels_read_all" ON public.sub_levels;
DROP POLICY IF EXISTS "sub_levels_admin_write" ON public.sub_levels;
CREATE POLICY "sub_levels_read_all" ON public.sub_levels FOR SELECT USING (true);
CREATE POLICY "sub_levels_admin_write" ON public.sub_levels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.levels (code, name, order_index) VALUES
  ('A1','Anfänger A1',1),('A2','Grundlagen A2',2),('B1','Mittelstufe B1',3),('B2','Mittelstufe B2',4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.sub_levels (level_id, code, name, estimated_hours, order_index)
SELECT l.id, sub.code, sub.name, sub.hours, sub.idx FROM public.levels l JOIN (VALUES
  ('A1','A1.1','A1.1 — Einstieg',60,1),
  ('A1','A1.2','A1.2 — Aufbau',60,2),
  ('A2','A2.1','A2.1 — Einstieg',80,3),
  ('A2','A2.2','A2.2 — Aufbau',80,4),
  ('B1','B1.1','B1.1 — Einstieg',100,5),
  ('B1','B1.2','B1.2 — Aufbau',100,6),
  ('B2','B2.1','B2.1 — Einstieg',120,7),
  ('B2','B2.2','B2.2 — Aufbau',120,8)
) AS sub(level_code, code, name, hours, idx) ON l.code = sub.level_code
ON CONFLICT (code) DO NOTHING;

-- =========== Academic years ===========
CREATE TABLE IF NOT EXISTS public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ay_member_read" ON public.academic_years;
DROP POLICY IF EXISTS "ay_owner_write" ON public.academic_years;
CREATE POLICY "ay_member_read" ON public.academic_years FOR SELECT TO authenticated
  USING (public.is_school_member(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ay_owner_write" ON public.academic_years FOR ALL TO authenticated
  USING (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_ay_updated ON public.academic_years;
CREATE TRIGGER trg_ay_updated BEFORE UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== School terms ===========
CREATE TABLE IF NOT EXISTS public.school_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  term_type text NOT NULL DEFAULT 'semester',
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_terms TO authenticated;
GRANT ALL ON public.school_terms TO service_role;
ALTER TABLE public.school_terms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "term_member_read" ON public.school_terms;
DROP POLICY IF EXISTS "term_owner_write" ON public.school_terms;
CREATE POLICY "term_member_read" ON public.school_terms FOR SELECT TO authenticated
  USING (public.is_school_member(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "term_owner_write" ON public.school_terms FOR ALL TO authenticated
  USING (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_term_updated ON public.school_terms;
CREATE TRIGGER trg_term_updated BEFORE UPDATE ON public.school_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== Extend classes (additive) ===========
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS term_id uuid REFERENCES public.school_terms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sub_level_id uuid REFERENCES public.sub_levels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS max_students int;

-- =========== Teacher assignments (CREATE BEFORE helper that references it) ===========
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'main_teacher',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, teacher_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ta_member_read" ON public.teacher_assignments;
DROP POLICY IF EXISTS "ta_owner_write" ON public.teacher_assignments;
CREATE POLICY "ta_member_read" ON public.teacher_assignments FOR SELECT TO authenticated
  USING (public.is_school_member(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ta_owner_write" ON public.teacher_assignments FOR ALL TO authenticated
  USING (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- Helper: any teacher (primary or assistant) of a class
CREATE OR REPLACE FUNCTION public.is_class_teacher_any(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.teacher_assignments WHERE class_id = _class_id AND teacher_id = _user_id);
$$;

-- =========== Enrollments ===========
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  final_score numeric,
  certificate_status text NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enroll_self_read" ON public.enrollments;
DROP POLICY IF EXISTS "enroll_school_write" ON public.enrollments;
CREATE POLICY "enroll_self_read" ON public.enrollments FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.is_school_owner(school_id, auth.uid())
    OR public.is_class_teacher_any(class_id, auth.uid())
  );
CREATE POLICY "enroll_school_write" ON public.enrollments FOR ALL TO authenticated
  USING (public.is_school_owner(school_id, auth.uid()) OR public.is_class_teacher_any(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_school_owner(school_id, auth.uid()) OR public.is_class_teacher_any(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_enroll_updated ON public.enrollments;
CREATE TRIGGER trg_enroll_updated BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== Attendance sessions & records ===========
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  title text,
  start_time time,
  end_time time,
  status text NOT NULL DEFAULT 'planned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT ALL ON public.attendance_sessions TO service_role;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "att_sess_read" ON public.attendance_sessions;
DROP POLICY IF EXISTS "att_sess_write" ON public.attendance_sessions;
CREATE POLICY "att_sess_read" ON public.attendance_sessions FOR SELECT TO authenticated
  USING (
    public.is_class_teacher_any(class_id, auth.uid())
    OR public.is_class_member(class_id, auth.uid())
    OR public.is_school_owner(school_id, auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "att_sess_write" ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.is_class_teacher_any(class_id, auth.uid()) OR public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_class_teacher_any(class_id, auth.uid()) OR public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_att_sess_updated ON public.attendance_sessions;
CREATE TRIGGER trg_att_sess_updated BEFORE UPDATE ON public.attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "att_rec_read" ON public.attendance_records;
DROP POLICY IF EXISTS "att_rec_write" ON public.attendance_records;
CREATE POLICY "att_rec_read" ON public.attendance_records FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = session_id
        AND (
          public.is_class_teacher_any(s.class_id, auth.uid())
          OR public.is_school_owner(s.school_id, auth.uid())
          OR public.has_role(auth.uid(),'admin')
        )
    )
  );
CREATE POLICY "att_rec_write" ON public.attendance_records FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = session_id
        AND (
          public.is_class_teacher_any(s.class_id, auth.uid())
          OR public.is_school_owner(s.school_id, auth.uid())
          OR public.has_role(auth.uid(),'admin')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = session_id
        AND (
          public.is_class_teacher_any(s.class_id, auth.uid())
          OR public.is_school_owner(s.school_id, auth.uid())
          OR public.has_role(auth.uid(),'admin')
        )
    )
  );
DROP TRIGGER IF EXISTS trg_att_rec_updated ON public.attendance_records;
CREATE TRIGGER trg_att_rec_updated BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== Certificates ===========
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  sub_level_id uuid REFERENCES public.sub_levels(id) ON DELETE SET NULL,
  certificate_number text NOT NULL UNIQUE,
  final_score numeric,
  mention text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pdf_url text,
  status text NOT NULL DEFAULT 'issued',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_read" ON public.certificates;
DROP POLICY IF EXISTS "cert_write" ON public.certificates;
CREATE POLICY "cert_read" ON public.certificates FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_school_owner(school_id, auth.uid())
    OR (class_id IS NOT NULL AND public.is_class_teacher_any(class_id, auth.uid()))
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "cert_write" ON public.certificates FOR ALL TO authenticated
  USING (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_school_owner(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_cert_updated ON public.certificates;
CREATE TRIGGER trg_cert_updated BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
