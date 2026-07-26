
-- Forum topics
CREATE TABLE public.forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general', -- general | grammar | vocab | exams | offtopic
  title text NOT NULL,
  content text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  locked boolean NOT NULL DEFAULT false,
  reply_count integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_topics TO authenticated;
GRANT ALL ON public.forum_topics TO service_role;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read topics" ON public.forum_topics FOR SELECT
  USING (school_id IS NULL OR public.is_school_member(school_id, auth.uid()));
CREATE POLICY "members create topics" ON public.forum_topics FOR INSERT
  WITH CHECK (author_id = auth.uid() AND (school_id IS NULL OR public.is_school_member(school_id, auth.uid())));
CREATE POLICY "author update topic" ON public.forum_topics FOR UPDATE
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid())))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid())));
CREATE POLICY "author delete topic" ON public.forum_topics FOR DELETE
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid())));

CREATE TRIGGER trg_forum_topics_updated BEFORE UPDATE ON public.forum_topics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Forum replies
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_replies TO authenticated;
GRANT ALL ON public.forum_replies TO service_role;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read replies" ON public.forum_replies FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.forum_topics t WHERE t.id = topic_id
    AND (t.school_id IS NULL OR public.is_school_member(t.school_id, auth.uid()))));
CREATE POLICY "members create replies" ON public.forum_replies FOR INSERT
  WITH CHECK (author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.forum_topics t WHERE t.id = topic_id AND NOT t.locked
      AND (t.school_id IS NULL OR public.is_school_member(t.school_id, auth.uid()))));
CREATE POLICY "author manage reply" ON public.forum_replies FOR UPDATE
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "author delete reply" ON public.forum_replies FOR DELETE
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_forum_replies_updated BEFORE UPDATE ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update topic activity + reply_count on reply insert
CREATE OR REPLACE FUNCTION public.bump_topic_activity()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.forum_topics
    SET reply_count = reply_count + 1, last_activity_at = now(), updated_at = now()
    WHERE id = NEW.topic_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_bump_topic AFTER INSERT ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION public.bump_topic_activity();

-- Likes
CREATE TABLE public.forum_likes (
  reply_id uuid NOT NULL REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reply_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.forum_likes TO authenticated;
GRANT ALL ON public.forum_likes TO service_role;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own likes" ON public.forum_likes FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "read likes" ON public.forum_likes FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.sync_reply_likes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_replies SET likes_count = likes_count + 1 WHERE id = NEW.reply_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_replies SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.reply_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_sync_likes AFTER INSERT OR DELETE ON public.forum_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_reply_likes();

-- Weekly challenges
CREATE TABLE public.weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general', -- vocab | grammar | streak | exam
  target_value integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 100,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_challenges TO authenticated;
GRANT ALL ON public.weekly_challenges TO service_role;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read challenges" ON public.weekly_challenges FOR SELECT
  USING (school_id IS NULL OR public.is_school_member(school_id, auth.uid()));
CREATE POLICY "moderators manage challenges" ON public.weekly_challenges FOR ALL
  USING (public.has_role(auth.uid(),'admin')
      OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
      OR (school_id IS NOT NULL AND public.is_school_teacher(school_id, auth.uid())))
  WITH CHECK (public.has_role(auth.uid(),'admin')
      OR (school_id IS NOT NULL AND public.is_school_owner(school_id, auth.uid()))
      OR (school_id IS NOT NULL AND public.is_school_teacher(school_id, auth.uid())));

-- Challenge participations
CREATE TABLE public.challenge_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_participations TO authenticated;
GRANT ALL ON public.challenge_participations TO service_role;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own participation" ON public.challenge_participations FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "read participations" ON public.challenge_participations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.weekly_challenges c WHERE c.id = challenge_id
    AND (c.school_id IS NULL OR public.is_school_member(c.school_id, auth.uid()))));
