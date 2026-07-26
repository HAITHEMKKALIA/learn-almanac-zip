
-- Placement tests (initial CEFR level assessment)
CREATE TABLE public.placement_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress | completed
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score numeric,
  recommended_level text, -- A1.1..B2.2
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placement_tests TO authenticated;
GRANT ALL ON public.placement_tests TO service_role;
ALTER TABLE public.placement_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own placement tests" ON public.placement_tests
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "teachers view students placement" ON public.placement_tests
  FOR SELECT USING (public.teacher_can_view_student(auth.uid(), user_id) OR public.has_role(auth.uid(),'admin'));

-- Personalized recommendations
CREATE TABLE public.learning_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL, -- 'weak_area' | 'next_step' | 'review'
  title text NOT NULL,
  description text,
  target_ref text, -- kapitel id, vocab theme, etc.
  priority integer NOT NULL DEFAULT 5, -- 1 high .. 10 low
  status text NOT NULL DEFAULT 'active', -- active | done | dismissed
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_recommendations TO authenticated;
GRANT ALL ON public.learning_recommendations TO service_role;
ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recommendations" ON public.learning_recommendations
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "teachers view student recs" ON public.learning_recommendations
  FOR SELECT USING (public.teacher_can_view_student(auth.uid(), user_id) OR public.has_role(auth.uid(),'admin'));

-- Exam success predictions (snapshots)
CREATE TABLE public.exam_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_level_id uuid REFERENCES public.sub_levels(id) ON DELETE SET NULL,
  target_level text,
  probability numeric NOT NULL, -- 0..100
  factors jsonb NOT NULL DEFAULT '{}'::jsonb, -- {xp, streak, avg_score, homework_rate,...}
  advice text,
  computed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_predictions TO authenticated;
GRANT ALL ON public.exam_predictions TO service_role;
ALTER TABLE public.exam_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own predictions" ON public.exam_predictions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "teachers view predictions" ON public.exam_predictions
  FOR SELECT USING (public.teacher_can_view_student(auth.uid(), user_id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_learning_recs_updated
BEFORE UPDATE ON public.learning_recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: compute exam success probability from real signals
CREATE OR REPLACE FUNCTION public.compute_exam_prediction(_target_level text DEFAULT NULL)
RETURNS public.exam_predictions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _xp int := 0;
  _streak int := 0;
  _level int := 1;
  _avg_score numeric := 0;
  _submissions_count int := 0;
  _homework_rate numeric := 0;
  _prob numeric;
  _advice text;
  _row public.exam_predictions;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT COALESCE(xp,0), COALESCE(current_streak,0), COALESCE(level,1)
    INTO _xp, _streak, _level
    FROM public.user_stats WHERE user_id = _uid;

  SELECT COALESCE(avg(score),0)::numeric, count(*)::int
    INTO _avg_score, _submissions_count
    FROM public.submissions
    WHERE student_id = _uid AND status IN ('submitted','graded') AND score IS NOT NULL;

  SELECT CASE WHEN count(*)=0 THEN 0
              ELSE round((count(*) FILTER (WHERE status IN ('submitted','graded')))::numeric
                         / count(*)::numeric * 100, 1) END
    INTO _homework_rate
    FROM public.homework_submissions
    WHERE student_id = _uid;

  -- Simple weighted heuristic 0..100
  _prob := LEAST(100, GREATEST(0,
      _avg_score * 0.5
    + LEAST(_streak, 30) * 1.0
    + LEAST(_xp/50.0, 20)
    + _homework_rate * 0.2
    + CASE WHEN _submissions_count >= 5 THEN 10 ELSE _submissions_count*2 END
  ));

  _advice := CASE
    WHEN _prob >= 80 THEN 'Excellent niveau. Continuez les révisions ciblées avant l''examen.'
    WHEN _prob >= 60 THEN 'Bon niveau. Renforcez vos points faibles et maintenez le streak.'
    WHEN _prob >= 40 THEN 'Progression correcte. Augmentez la régularité et faites plus d''exercices notés.'
    ELSE 'Il faut consolider les bases avant l''examen. Suivez les recommandations personnalisées.'
  END;

  INSERT INTO public.exam_predictions (user_id, target_level, probability, factors, advice)
  VALUES (_uid, _target_level, _prob,
    jsonb_build_object(
      'xp', _xp, 'streak', _streak, 'level', _level,
      'avg_score', _avg_score, 'submissions', _submissions_count,
      'homework_rate', _homework_rate),
    _advice)
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;
