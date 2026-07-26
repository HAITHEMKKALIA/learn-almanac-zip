
-- Homework tables for teacher-given exercises
CREATE TABLE public.homework (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  category TEXT NOT NULL DEFAULT 'schreiben', -- schreiben | sprechen | grammatik | lesen | hoeren | wortschatz | sonstige
  level TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  due_at TIMESTAMPTZ,
  max_points INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'open', -- open | closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.homework_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | graded | returned
  score NUMERIC,
  teacher_feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (homework_id, student_id)
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

-- Homework policies
CREATE POLICY "Teacher manage own homework" ON public.homework
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students view homework of their class" ON public.homework
  FOR SELECT USING (public.is_class_member(class_id, auth.uid()));

CREATE POLICY "Admin all homework" ON public.homework
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Submission policies
CREATE POLICY "Student manage own submission" ON public.homework_submissions
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teacher view class submissions" ON public.homework_submissions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_submissions.homework_id AND h.teacher_id = auth.uid()
  ));

CREATE POLICY "Teacher grade submissions" ON public.homework_submissions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_submissions.homework_id AND h.teacher_id = auth.uid()
  ));

CREATE TRIGGER update_homework_updated_at
  BEFORE UPDATE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homework_submissions_updated_at
  BEFORE UPDATE ON public.homework_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_homework_class ON public.homework(class_id);
CREATE INDEX idx_homework_teacher ON public.homework(teacher_id);
CREATE INDEX idx_hw_subs_homework ON public.homework_submissions(homework_id);
CREATE INDEX idx_hw_subs_student ON public.homework_submissions(student_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.homework;
ALTER PUBLICATION supabase_realtime ADD TABLE public.homework_submissions;
