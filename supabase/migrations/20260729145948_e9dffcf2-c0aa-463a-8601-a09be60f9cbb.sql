
CREATE TABLE public.student_success_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  sub_level_id UUID REFERENCES public.sub_levels(id) ON DELETE SET NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  mention TEXT NOT NULL,
  notes TEXT,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','issued','revoked'))
);

CREATE INDEX ssv_school_idx ON public.student_success_validations(school_id, status);
CREATE INDEX ssv_student_idx ON public.student_success_validations(student_id);
CREATE INDEX ssv_teacher_idx ON public.student_success_validations(teacher_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_success_validations TO authenticated;
GRANT ALL ON public.student_success_validations TO service_role;

ALTER TABLE public.student_success_validations ENABLE ROW LEVEL SECURITY;

-- Teachers: insert only for their own classes in the school
CREATE POLICY ssv_teacher_insert ON public.student_success_validations
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND (
      (class_id IS NOT NULL AND public.is_class_teacher_any(class_id, auth.uid()))
      OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin','admin','academic_director','pedagogical_coordinator']::app_role[])
    )
  );

-- Read: teacher who created it, student concerned, or school admins/coordinators
CREATE POLICY ssv_select ON public.student_success_validations
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
    OR student_id = auth.uid()
    OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin','admin','academic_director','pedagogical_coordinator']::app_role[])
    OR public.is_super_admin(auth.uid())
  );

-- Update: original teacher (before issued) or school admins
CREATE POLICY ssv_update ON public.student_success_validations
  FOR UPDATE TO authenticated
  USING (
    (teacher_id = auth.uid() AND status = 'pending')
    OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin','admin','academic_director','pedagogical_coordinator']::app_role[])
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (teacher_id = auth.uid() AND status = 'pending')
    OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin','admin','academic_director','pedagogical_coordinator']::app_role[])
    OR public.is_super_admin(auth.uid())
  );

-- Delete: original teacher (before issued) or school admins
CREATE POLICY ssv_delete ON public.student_success_validations
  FOR DELETE TO authenticated
  USING (
    (teacher_id = auth.uid() AND status = 'pending')
    OR public.has_school_role(school_id, auth.uid(), ARRAY['school_admin','admin']::app_role[])
    OR public.is_super_admin(auth.uid())
  );
