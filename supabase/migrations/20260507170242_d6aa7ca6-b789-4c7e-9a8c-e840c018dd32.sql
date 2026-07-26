
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE public.cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2');
CREATE TYPE public.question_kind AS ENUM ('qcm', 'audio', 'translate', 'write', 'speak');
CREATE TYPE public.question_skill AS ENUM ('lesen', 'hoeren', 'schreiben', 'sprechen', 'wortschatz', 'grammatik');
CREATE TYPE public.question_source AS ENUM ('goethe', 'oesd', 'custom');
CREATE TYPE public.assignment_status AS ENUM ('draft', 'scheduled', 'open', 'closed');
CREATE TYPE public.submission_status AS ENUM ('not_started', 'in_progress', 'submitted', 'graded', 'expired');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  preferred_lang TEXT NOT NULL DEFAULT 'fr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_teacher_or_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('teacher','admin')) $$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ AUTO PROFILE + DEFAULT STUDENT ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ CLASSES ============
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level cefr_level NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text) for 6)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id) $$;

CREATE OR REPLACE FUNCTION public.is_class_member(_class_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.class_members WHERE class_id = _class_id AND student_id = _user_id) $$;

CREATE POLICY "Teachers manage own classes" ON public.classes FOR ALL
  USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Students view their classes" ON public.classes FOR SELECT
  USING (public.is_class_member(id, auth.uid()));
CREATE POLICY "Admins all classes" ON public.classes FOR ALL USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Teacher view members" ON public.class_members FOR SELECT
  USING (public.is_class_teacher(class_id, auth.uid()));
CREATE POLICY "Student view own membership" ON public.class_members FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY "Student join class" ON public.class_members FOR INSERT
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Student leave class" ON public.class_members FOR DELETE
  USING (auth.uid() = student_id);
CREATE POLICY "Teacher remove member" ON public.class_members FOR DELETE
  USING (public.is_class_teacher(class_id, auth.uid()));

-- ============ QUESTION BANK ============
CREATE TABLE public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source question_source NOT NULL DEFAULT 'custom',
  level cefr_level NOT NULL,
  skill question_skill NOT NULL,
  kind question_kind NOT NULL,
  prompt_de TEXT NOT NULL,
  prompt_fr TEXT,
  prompt_ar TEXT,
  audio_text TEXT,
  options_de JSONB,
  options_fr JSONB,
  options_ar JSONB,
  correct_answer TEXT NOT NULL,
  explanation_fr TEXT,
  explanation_ar TEXT,
  points INT NOT NULL DEFAULT 1,
  is_public BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public bank readable by teachers" ON public.question_bank FOR SELECT
  USING (is_public = true AND public.is_teacher_or_admin(auth.uid()));
CREATE POLICY "Owner manages questions" ON public.question_bank FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admin all bank" ON public.question_bank FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- ============ ASSIGNMENTS ============
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  level cefr_level NOT NULL,
  status assignment_status NOT NULL DEFAULT 'draft',
  duration_minutes INT NOT NULL DEFAULT 30,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  max_attempts INT NOT NULL DEFAULT 1,
  shuffle_questions BOOLEAN NOT NULL DEFAULT true,
  lockdown_strict BOOLEAN NOT NULL DEFAULT true,
  passing_score INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assignment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  points_override INT,
  UNIQUE (assignment_id, question_id)
);
ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher manage own assignments" ON public.assignments FOR ALL
  USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Students view assignments of their class" ON public.assignments FOR SELECT
  USING (public.is_class_member(class_id, auth.uid()) AND status IN ('open','scheduled','closed'));
CREATE POLICY "Admin all assignments" ON public.assignments FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- ============ SUBMISSIONS (created BEFORE the access function) ============
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status submission_status NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score INT,
  total INT,
  teacher_feedback TEXT,
  attempt_no INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id, attempt_no)
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.submission_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN,
  awarded_points NUMERIC,
  teacher_comment TEXT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, question_id)
);
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;

-- Now safe to define the access helper
CREATE OR REPLACE FUNCTION public.student_can_access_questions(_assignment_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.assignment_id = _assignment_id
      AND s.student_id = _user_id
      AND s.status = 'in_progress'
      AND (s.expires_at IS NULL OR s.expires_at > now())
      AND a.status = 'open'
  )
$$;

CREATE POLICY "Teacher view assignment questions" ON public.assignment_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()));
CREATE POLICY "Teacher manage assignment questions" ON public.assignment_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()));
CREATE POLICY "Student access questions during exam" ON public.assignment_questions FOR SELECT
  USING (public.student_can_access_questions(assignment_id, auth.uid()));

CREATE POLICY "Student read bank during exam" ON public.question_bank FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.assignment_questions aq
    WHERE aq.question_id = question_bank.id
      AND public.student_can_access_questions(aq.assignment_id, auth.uid())
  ));

CREATE POLICY "Student own submissions" ON public.submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Student create submission" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Student update own submission" ON public.submissions FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Teacher view class submissions" ON public.submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()));
CREATE POLICY "Teacher grade submissions" ON public.submissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()));

CREATE POLICY "Student own answers" ON public.submission_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND s.student_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND s.student_id = auth.uid()));
CREATE POLICY "Teacher view answers" ON public.submission_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.submissions s JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = submission_id AND a.teacher_id = auth.uid()
  ));
CREATE POLICY "Teacher grade answers" ON public.submission_answers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.submissions s JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = submission_id AND a.teacher_id = auth.uid()
  ));

-- ============ EXAM EVENTS ============
CREATE TABLE public.exam_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student log own events" ON public.exam_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND s.student_id = auth.uid()));
CREATE POLICY "Teacher view events" ON public.exam_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.submissions s JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = submission_id AND a.teacher_id = auth.uid()
  ));
CREATE POLICY "Student view own events" ON public.exam_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND s.student_id = auth.uid()));

-- ============ TIMESTAMPS TRIGGERS ============
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_classes_updated BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_qbank_updated BEFORE UPDATE ON public.question_bank
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_assignments_updated BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_submissions_updated BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INDEXES ============
CREATE INDEX idx_class_members_student ON public.class_members(student_id);
CREATE INDEX idx_class_members_class ON public.class_members(class_id);
CREATE INDEX idx_assignments_class ON public.assignments(class_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);
CREATE INDEX idx_submissions_student ON public.submissions(student_id);
CREATE INDEX idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX idx_qbank_level_skill ON public.question_bank(level, skill);
CREATE INDEX idx_aq_assignment ON public.assignment_questions(assignment_id);
CREATE INDEX idx_exam_events_submission ON public.exam_events(submission_id);
