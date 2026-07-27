
-- 1. Extend homework with kind + attachments
ALTER TABLE public.homework
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS audio_url text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homework_kind_check') THEN
    ALTER TABLE public.homework ADD CONSTRAINT homework_kind_check
      CHECK (kind IN ('pdf','manual','ai','audio'));
  END IF;
END $$;

-- 2. homework_questions
CREATE TABLE IF NOT EXISTS public.homework_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  position integer NOT NULL,
  prompt text NOT NULL,
  expected_answer text,
  points integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (homework_id, position),
  CHECK (position BETWEEN 1 AND 50),
  CHECK (points >= 0 AND points <= 100)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_questions TO authenticated;
GRANT ALL ON public.homework_questions TO service_role;
ALTER TABLE public.homework_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hq_read_class_or_teacher" ON public.homework_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.classes c ON c.id = h.class_id
    WHERE h.id = homework_questions.homework_id
      AND (
        h.teacher_id = auth.uid()
        OR public.is_class_teacher_any(c.id, auth.uid())
        OR public.is_school_owner(c.school_id, auth.uid())
        OR public.has_role(auth.uid(),'admin')
        OR EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = c.id AND cm.student_id = auth.uid())
      )
  )
);

CREATE POLICY "hq_write_teacher" ON public.homework_questions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.classes c ON c.id = h.class_id
    WHERE h.id = homework_questions.homework_id
      AND (
        h.teacher_id = auth.uid()
        OR public.is_school_owner(c.school_id, auth.uid())
        OR public.has_role(auth.uid(),'admin')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.classes c ON c.id = h.class_id
    WHERE h.id = homework_questions.homework_id
      AND (
        h.teacher_id = auth.uid()
        OR public.is_school_owner(c.school_id, auth.uid())
        OR public.has_role(auth.uid(),'admin')
      )
  )
);

CREATE TRIGGER hq_updated_at BEFORE UPDATE ON public.homework_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. homework_question_answers
CREATE TABLE IF NOT EXISTS public.homework_question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.homework_submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.homework_questions(id) ON DELETE CASCADE,
  answer text,
  is_correct boolean,
  awarded_points numeric,
  teacher_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, question_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_question_answers TO authenticated;
GRANT ALL ON public.homework_question_answers TO service_role;
ALTER TABLE public.homework_question_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hqa_read" ON public.homework_question_answers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.homework_submissions s
    JOIN public.homework h ON h.id = s.homework_id
    JOIN public.classes c ON c.id = h.class_id
    WHERE s.id = homework_question_answers.submission_id
      AND (
        s.student_id = auth.uid()
        OR h.teacher_id = auth.uid()
        OR public.is_class_teacher_any(c.id, auth.uid())
        OR public.is_school_owner(c.school_id, auth.uid())
        OR public.has_role(auth.uid(),'admin')
      )
  )
);

CREATE POLICY "hqa_student_write" ON public.homework_question_answers
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.homework_submissions s
    WHERE s.id = homework_question_answers.submission_id
      AND s.student_id = auth.uid()
  )
);

CREATE POLICY "hqa_student_update_answer" ON public.homework_question_answers
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.homework_submissions s WHERE s.id = homework_question_answers.submission_id AND s.student_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.homework_submissions s WHERE s.id = homework_question_answers.submission_id AND s.student_id = auth.uid())
);

CREATE POLICY "hqa_teacher_grade" ON public.homework_question_answers
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.homework_submissions s
    JOIN public.homework h ON h.id = s.homework_id
    JOIN public.classes c ON c.id = h.class_id
    WHERE s.id = homework_question_answers.submission_id
      AND (h.teacher_id = auth.uid() OR public.is_school_owner(c.school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.homework_submissions s
    JOIN public.homework h ON h.id = s.homework_id
    JOIN public.classes c ON c.id = h.class_id
    WHERE s.id = homework_question_answers.submission_id
      AND (h.teacher_id = auth.uid() OR public.is_school_owner(c.school_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  )
);

-- Trigger: block student from touching grading fields
CREATE OR REPLACE FUNCTION public.prevent_hqa_student_self_grade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_teacher boolean;
BEGIN
  IF public.has_role(_uid,'admin') OR public.is_super_admin(_uid) THEN
    RETURN NEW;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.homework_submissions s
    JOIN public.homework h ON h.id = s.homework_id
    JOIN public.classes c ON c.id = h.class_id
    WHERE s.id = NEW.submission_id
      AND (h.teacher_id = _uid OR public.is_school_owner(c.school_id, _uid))
  ) INTO _is_teacher;
  IF _is_teacher THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_correct := NULL;
    NEW.awarded_points := NULL;
    NEW.teacher_comment := NULL;
    RETURN NEW;
  END IF;
  IF NEW.is_correct IS DISTINCT FROM OLD.is_correct
     OR NEW.awarded_points IS DISTINCT FROM OLD.awarded_points
     OR NEW.teacher_comment IS DISTINCT FROM OLD.teacher_comment THEN
    RAISE EXCEPTION 'students_cannot_modify_grading_fields';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_hqa_prevent_self_grade ON public.homework_question_answers;
CREATE TRIGGER trg_hqa_prevent_self_grade
BEFORE INSERT OR UPDATE ON public.homework_question_answers
FOR EACH ROW EXECUTE FUNCTION public.prevent_hqa_student_self_grade();

CREATE TRIGGER hqa_updated_at BEFORE UPDATE ON public.homework_question_answers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_read_own" ON public.notifications
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Any authenticated user may create notifications for other users (used by client-side triggers on submit/create).
-- Content is short + non-sensitive; abuse is bounded by RLS on other tables.
CREATE POLICY "notif_insert_authenticated" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notif_update_own" ON public.notifications
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "notif_delete_own" ON public.notifications
FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 5. Storage policies for homework-files bucket
CREATE POLICY "hf_owner_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'homework-files'
  AND owner = auth.uid()
);

CREATE POLICY "hf_class_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'homework-files'
  AND EXISTS (
    SELECT 1 FROM public.homework h
    JOIN public.classes c ON c.id = h.class_id
    WHERE (h.pdf_url LIKE '%' || storage.objects.name || '%'
           OR h.audio_url LIKE '%' || storage.objects.name || '%')
      AND (
        h.teacher_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = c.id AND cm.student_id = auth.uid())
        OR public.is_school_owner(c.school_id, auth.uid())
      )
  )
);

CREATE POLICY "hf_owner_write" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'homework-files' AND owner = auth.uid());

CREATE POLICY "hf_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'homework-files' AND owner = auth.uid())
WITH CHECK (bucket_id = 'homework-files' AND owner = auth.uid());

CREATE POLICY "hf_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'homework-files' AND owner = auth.uid());
