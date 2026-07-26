-- Phase 6: Gamification

-- user_stats
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own stats read" ON public.user_stats FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_teacher_or_admin(auth.uid()));
CREATE POLICY "own stats upsert" ON public.user_stats FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own stats update" ON public.user_stats FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_user_stats_updated BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- badges catalog
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_de text NOT NULL,
  name_ar text,
  description_fr text,
  description_de text,
  description_ar text,
  icon text,
  xp_reward integer NOT NULL DEFAULT 0,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges readable" ON public.badges FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "badges admin write" ON public.badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own badges read" ON public.user_badges FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_teacher_or_admin(auth.uid()));
CREATE POLICY "own badges insert" ON public.user_badges FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- xp_events
CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  xp integer NOT NULL,
  ref_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_xp_events_user_date ON public.xp_events(user_id, created_at DESC);

CREATE POLICY "own xp read" ON public.xp_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_teacher_or_admin(auth.uid()));
CREATE POLICY "own xp insert" ON public.xp_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- award_xp RPC: increments XP, updates streak, recomputes level
CREATE OR REPLACE FUNCTION public.award_xp(_event_type text, _xp integer, _ref_id uuid DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS public.user_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _stats public.user_stats;
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _new_streak integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _xp IS NULL OR _xp < 0 OR _xp > 1000 THEN RAISE EXCEPTION 'invalid_xp'; END IF;

  INSERT INTO public.xp_events (user_id, event_type, xp, ref_id, metadata)
  VALUES (_uid, _event_type, _xp, _ref_id, COALESCE(_metadata, '{}'::jsonb));

  INSERT INTO public.user_stats (user_id, xp, level, current_streak, longest_streak, last_activity_date)
  VALUES (_uid, 0, 1, 0, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _stats FROM public.user_stats WHERE user_id = _uid FOR UPDATE;

  IF _stats.last_activity_date IS NULL THEN
    _new_streak := 1;
  ELSIF _stats.last_activity_date = _today THEN
    _new_streak := GREATEST(_stats.current_streak, 1);
  ELSIF _stats.last_activity_date = _today - 1 THEN
    _new_streak := _stats.current_streak + 1;
  ELSE
    _new_streak := 1;
  END IF;

  UPDATE public.user_stats
     SET xp = xp + _xp,
         level = floor(sqrt((xp + _xp)::numeric / 50)) + 1,
         current_streak = _new_streak,
         longest_streak = GREATEST(longest_streak, _new_streak),
         last_activity_date = _today,
         updated_at = now()
   WHERE user_id = _uid
   RETURNING * INTO _stats;

  RETURN _stats;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_xp(text, integer, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_xp(text, integer, uuid, jsonb) TO authenticated;

-- Seed a few starter badges
INSERT INTO public.badges (code, name_fr, name_de, name_ar, description_fr, description_de, icon, xp_reward, criteria) VALUES
  ('first_lesson', 'Première leçon', 'Erste Lektion', 'الدرس الأول', 'Termine ta première leçon', 'Schließe deine erste Lektion ab', '🎓', 20, '{"event":"lesson_completed","count":1}'::jsonb),
  ('streak_7', 'Série de 7 jours', '7-Tage-Serie', 'سلسلة 7 أيام', 'Étudie 7 jours d''affilée', '7 Tage in Folge lernen', '🔥', 50, '{"streak":7}'::jsonb),
  ('streak_30', 'Série de 30 jours', '30-Tage-Serie', 'سلسلة 30 يومًا', 'Étudie 30 jours d''affilée', '30 Tage in Folge lernen', '🏆', 200, '{"streak":30}'::jsonb),
  ('level_5', 'Niveau 5', 'Stufe 5', 'المستوى 5', 'Atteins le niveau 5', 'Erreiche Stufe 5', '⭐', 0, '{"level":5}'::jsonb),
  ('vocab_100', '100 mots appris', '100 Wörter gelernt', '100 كلمة', 'Maîtrise 100 mots de vocabulaire', 'Beherrsche 100 Vokabeln', '📚', 100, '{"vocab":100}'::jsonb)
ON CONFLICT (code) DO NOTHING;
