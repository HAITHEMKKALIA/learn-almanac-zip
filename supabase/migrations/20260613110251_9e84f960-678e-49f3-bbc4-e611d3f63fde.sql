
-- =========== content_libraries ===========
CREATE TABLE IF NOT EXISTS public.content_libraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'school_custom',     -- official | school_custom | teacher_custom
  version text NOT NULL DEFAULT 'v1',
  status text NOT NULL DEFAULT 'draft',           -- draft | published | archived
  source_library_id uuid REFERENCES public.content_libraries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_libraries TO authenticated;
GRANT SELECT ON public.content_libraries TO anon;
GRANT ALL ON public.content_libraries TO service_role;
ALTER TABLE public.content_libraries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lib_read" ON public.content_libraries;
DROP POLICY IF EXISTS "lib_write_school" ON public.content_libraries;
DROP POLICY IF EXISTS "lib_write_owner" ON public.content_libraries;
DROP POLICY IF EXISTS "lib_write_admin" ON public.content_libraries;
CREATE POLICY "lib_read" ON public.content_libraries FOR SELECT
  USING (
    type = 'official' AND status = 'published'
    OR (school_id IS NOT NULL AND public.is_school_member(school_id, auth.uid()))
    OR owner_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "lib_write_admin" ON public.content_libraries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "lib_write_school" ON public.content_libraries FOR ALL TO authenticated
  USING (
    type IN ('school_custom','teacher_custom')
    AND school_id IS NOT NULL
    AND (public.is_school_owner(school_id, auth.uid()) OR owner_id = auth.uid())
  )
  WITH CHECK (
    type IN ('school_custom','teacher_custom')
    AND school_id IS NOT NULL
    AND (public.is_school_owner(school_id, auth.uid()) OR owner_id = auth.uid())
  );
DROP TRIGGER IF EXISTS trg_lib_updated ON public.content_libraries;
CREATE TRIGGER trg_lib_updated BEFORE UPDATE ON public.content_libraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper used by all downstream tables
CREATE OR REPLACE FUNCTION public.can_read_library(_library_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.content_libraries cl
    WHERE cl.id = _library_id
      AND (
        (cl.type = 'official' AND cl.status = 'published')
        OR (cl.school_id IS NOT NULL AND public.is_school_member(cl.school_id, _user_id))
        OR cl.owner_id = _user_id
        OR public.has_role(_user_id,'admin')
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_write_library(_library_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.content_libraries cl
    WHERE cl.id = _library_id
      AND (
        public.has_role(_user_id,'admin')
        OR (cl.type IN ('school_custom','teacher_custom')
            AND cl.school_id IS NOT NULL
            AND (public.is_school_owner(cl.school_id, _user_id) OR cl.owner_id = _user_id))
      )
  )
$$;

-- =========== course_units ===========
CREATE TABLE IF NOT EXISTS public.course_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.content_libraries(id) ON DELETE CASCADE,
  level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL,
  sub_level_id uuid REFERENCES public.sub_levels(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  kapitel_number int,
  order_index int NOT NULL DEFAULT 0,
  estimated_minutes int,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_units TO authenticated;
GRANT SELECT ON public.course_units TO anon;
GRANT ALL ON public.course_units TO service_role;
ALTER TABLE public.course_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cu_read" ON public.course_units;
DROP POLICY IF EXISTS "cu_write" ON public.course_units;
CREATE POLICY "cu_read" ON public.course_units FOR SELECT
  USING (public.can_read_library(library_id, auth.uid()));
CREATE POLICY "cu_write" ON public.course_units FOR ALL TO authenticated
  USING (public.can_write_library(library_id, auth.uid()))
  WITH CHECK (public.can_write_library(library_id, auth.uid()));
DROP TRIGGER IF EXISTS trg_cu_updated ON public.course_units;
CREATE TRIGGER trg_cu_updated BEFORE UPDATE ON public.course_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== lessons ===========
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_unit_id uuid NOT NULL REFERENCES public.course_units(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  skill text NOT NULL DEFAULT 'uebung',
  order_index int NOT NULL DEFAULT 0,
  estimated_minutes int,
  difficulty int,
  content_source text NOT NULL DEFAULT 'teacher_created', -- static | ai_generated | imported | teacher_created
  content_version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lessons_unit ON public.lessons(course_unit_id, order_index);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT SELECT ON public.lessons TO anon;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lesson_read" ON public.lessons;
DROP POLICY IF EXISTS "lesson_write" ON public.lessons;
CREATE POLICY "lesson_read" ON public.lessons FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.course_units cu WHERE cu.id = course_unit_id AND public.can_read_library(cu.library_id, auth.uid())));
CREATE POLICY "lesson_write" ON public.lessons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_units cu WHERE cu.id = course_unit_id AND public.can_write_library(cu.library_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.course_units cu WHERE cu.id = course_unit_id AND public.can_write_library(cu.library_id, auth.uid())));
DROP TRIGGER IF EXISTS trg_lesson_updated ON public.lessons;
CREATE TRIGGER trg_lesson_updated BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== lesson_sections ===========
CREATE TABLE IF NOT EXISTS public.lesson_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  content_json jsonb,
  media_url text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sections_lesson ON public.lesson_sections(lesson_id, order_index);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_sections TO authenticated;
GRANT SELECT ON public.lesson_sections TO anon;
GRANT ALL ON public.lesson_sections TO service_role;
ALTER TABLE public.lesson_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ls_read" ON public.lesson_sections;
DROP POLICY IF EXISTS "ls_write" ON public.lesson_sections;
CREATE POLICY "ls_read" ON public.lesson_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.course_units cu ON cu.id = l.course_unit_id
    WHERE l.id = lesson_id AND public.can_read_library(cu.library_id, auth.uid())
  ));
CREATE POLICY "ls_write" ON public.lesson_sections FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.course_units cu ON cu.id = l.course_unit_id
    WHERE l.id = lesson_id AND public.can_write_library(cu.library_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.course_units cu ON cu.id = l.course_unit_id
    WHERE l.id = lesson_id AND public.can_write_library(cu.library_id, auth.uid())
  ));

-- =========== exercises ===========
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type text NOT NULL,
  question text NOT NULL,
  options_json jsonb,
  correct_answer_json jsonb,
  explanation text,
  difficulty int,
  skill text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exercises_lesson ON public.exercises(lesson_id, order_index);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ex_read" ON public.exercises;
DROP POLICY IF EXISTS "ex_write" ON public.exercises;
CREATE POLICY "ex_read" ON public.exercises FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.course_units cu ON cu.id = l.course_unit_id
    WHERE l.id = lesson_id AND public.can_read_library(cu.library_id, auth.uid())
  ));
CREATE POLICY "ex_write" ON public.exercises FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.course_units cu ON cu.id = l.course_unit_id
    WHERE l.id = lesson_id AND public.can_write_library(cu.library_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.course_units cu ON cu.id = l.course_unit_id
    WHERE l.id = lesson_id AND public.can_write_library(cu.library_id, auth.uid())
  ));
DROP TRIGGER IF EXISTS trg_ex_updated ON public.exercises;
CREATE TRIGGER trg_ex_updated BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== media_assets ===========
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,                 -- image | audio | video | pdf
  url text NOT NULL,
  title text,
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_read" ON public.media_assets;
DROP POLICY IF EXISTS "media_write" ON public.media_assets;
CREATE POLICY "media_read" ON public.media_assets FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (school_id IS NOT NULL AND public.is_school_member(school_id, auth.uid()))
  );
CREATE POLICY "media_write" ON public.media_assets FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  );

-- =========== ai_generation_logs ===========
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  prompt text,
  result_json jsonb,
  model text,
  status text NOT NULL DEFAULT 'draft',  -- draft | validated | rejected | published
  validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON public.ai_generation_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_school ON public.ai_generation_logs(school_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generation_logs TO authenticated;
GRANT ALL ON public.ai_generation_logs TO service_role;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_log_read" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "ai_log_insert" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "ai_log_update" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "ai_log_delete" ON public.ai_generation_logs;
CREATE POLICY "ai_log_read" ON public.ai_generation_logs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  );
CREATE POLICY "ai_log_insert" ON public.ai_generation_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_log_update" ON public.ai_generation_logs FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
  );
CREATE POLICY "ai_log_delete" ON public.ai_generation_logs FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_ai_log_updated ON public.ai_generation_logs;
CREATE TRIGGER trg_ai_log_updated BEFORE UPDATE ON public.ai_generation_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== Seed official library shell (idempotent) ===========
INSERT INTO public.content_libraries (name, type, version, status)
SELECT 'Deutsch Meister — Bibliothèque officielle', 'official', 'v1', 'published'
WHERE NOT EXISTS (SELECT 1 FROM public.content_libraries WHERE type='official' AND version='v1');
