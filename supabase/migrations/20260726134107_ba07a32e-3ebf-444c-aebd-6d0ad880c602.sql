
-- Block students from tampering with grading/approval fields via BEFORE UPDATE triggers.

-- 1) profiles.approved cannot be changed by the user themselves; only admins.
CREATE OR REPLACE FUNCTION public.prevent_profile_self_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approved IS DISTINCT FROM OLD.approved
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized_to_change_approval';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id_immutable';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_profile_self_approval ON public.profiles;
CREATE TRIGGER trg_prevent_profile_self_approval
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_self_approval();

-- 2) submissions: students cannot alter grading fields.
CREATE OR REPLACE FUNCTION public.prevent_submission_self_grade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_teacher boolean;
BEGIN
  IF public.has_role(_uid,'admin') OR public.is_super_admin(_uid) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = NEW.assignment_id AND a.teacher_id = _uid
  ) INTO _is_teacher;

  IF _is_teacher THEN
    RETURN NEW;
  END IF;

  -- From here: acting as student. Block grading-related field changes.
  IF NEW.score IS DISTINCT FROM OLD.score
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.teacher_feedback IS DISTINCT FROM OLD.teacher_feedback
     OR NEW.released_at IS DISTINCT FROM OLD.released_at THEN
    RAISE EXCEPTION 'students_cannot_modify_grading_fields';
  END IF;

  -- Restrict status transitions to non-terminal states from student side.
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status::text NOT IN ('in_progress','submitted') THEN
    RAISE EXCEPTION 'invalid_status_transition_for_student';
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_submission_self_grade ON public.submissions;
CREATE TRIGGER trg_prevent_submission_self_grade
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.prevent_submission_self_grade();

-- 3) submission_answers: students cannot set grading columns.
CREATE OR REPLACE FUNCTION public.prevent_submission_answer_self_grade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_teacher boolean;
BEGIN
  IF public.has_role(_uid,'admin') OR public.is_super_admin(_uid) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = NEW.submission_id AND a.teacher_id = _uid
  ) INTO _is_teacher;

  IF _is_teacher THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Students may only insert an answer with pending grading, no points/correctness.
    IF COALESCE(NEW.awarded_points, 0) <> 0
       OR NEW.is_correct IS NOT NULL
       OR NEW.teacher_comment IS NOT NULL
       OR NEW.ai_graded = true
       OR NEW.grading_status <> 'pending'::public.grading_status THEN
      RAISE EXCEPTION 'students_cannot_set_grading_on_insert';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE by student
  IF NEW.awarded_points IS DISTINCT FROM OLD.awarded_points
     OR NEW.is_correct IS DISTINCT FROM OLD.is_correct
     OR NEW.teacher_comment IS DISTINCT FROM OLD.teacher_comment
     OR NEW.ai_graded IS DISTINCT FROM OLD.ai_graded
     OR NEW.grading_status IS DISTINCT FROM OLD.grading_status THEN
    RAISE EXCEPTION 'students_cannot_modify_grading_fields';
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_submission_answer_self_grade ON public.submission_answers;
CREATE TRIGGER trg_prevent_submission_answer_self_grade
BEFORE INSERT OR UPDATE ON public.submission_answers
FOR EACH ROW EXECUTE FUNCTION public.prevent_submission_answer_self_grade();

-- 4) homework_submissions: students cannot set score/feedback/graded_at/ai_graded.
CREATE OR REPLACE FUNCTION public.prevent_homework_submission_self_grade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_teacher boolean;
BEGIN
  IF public.has_role(_uid,'admin') OR public.is_super_admin(_uid) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = NEW.homework_id AND h.teacher_id = _uid
  ) INTO _is_teacher;

  IF _is_teacher THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.score IS NOT NULL
       OR NEW.teacher_feedback IS NOT NULL
       OR NEW.graded_at IS NOT NULL
       OR COALESCE(NEW.ai_graded, false) = true
       OR NEW.status NOT IN ('draft','submitted') THEN
      RAISE EXCEPTION 'students_cannot_set_grading_on_insert';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE by student
  IF NEW.score IS DISTINCT FROM OLD.score
     OR NEW.teacher_feedback IS DISTINCT FROM OLD.teacher_feedback
     OR NEW.graded_at IS DISTINCT FROM OLD.graded_at
     OR NEW.ai_graded IS DISTINCT FROM OLD.ai_graded THEN
    RAISE EXCEPTION 'students_cannot_modify_grading_fields';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('draft','submitted') THEN
    RAISE EXCEPTION 'invalid_status_transition_for_student';
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_homework_submission_self_grade ON public.homework_submissions;
CREATE TRIGGER trg_prevent_homework_submission_self_grade
BEFORE INSERT OR UPDATE ON public.homework_submissions
FOR EACH ROW EXECUTE FUNCTION public.prevent_homework_submission_self_grade();
