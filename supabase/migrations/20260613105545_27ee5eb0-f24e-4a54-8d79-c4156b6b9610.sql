
-- Helper
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT approved FROM public.profiles WHERE user_id = _user_id), false)
$$;

-- =========== chat_history ===========
ALTER TABLE public.chat_history ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_chat_history_user ON public.chat_history(user_id);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_history FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;
GRANT ALL ON public.chat_history TO service_role;

DROP POLICY IF EXISTS "Anyone can read chat" ON public.chat_history;
DROP POLICY IF EXISTS "Authenticated can insert chat" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_owner_select" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_owner_insert" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_owner_update" ON public.chat_history;
DROP POLICY IF EXISTS "chat_history_owner_delete" ON public.chat_history;

CREATE POLICY "chat_history_owner_select" ON public.chat_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "chat_history_owner_insert" ON public.chat_history
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_history_owner_update" ON public.chat_history
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_history_owner_delete" ON public.chat_history
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =========== user_progress ===========
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_id);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_progress FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;

DROP POLICY IF EXISTS "Anyone can read progress" ON public.user_progress;
DROP POLICY IF EXISTS "Authenticated can insert progress" ON public.user_progress;
DROP POLICY IF EXISTS "Authenticated can update progress" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_self_select" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_self_insert" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_self_update" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_self_delete" ON public.user_progress;

CREATE POLICY "user_progress_self_select" ON public.user_progress
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (user_id IS NOT NULL AND public.teacher_can_view_student(auth.uid(), user_id))
  );
CREATE POLICY "user_progress_self_insert" ON public.user_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_progress_self_update" ON public.user_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_progress_self_delete" ON public.user_progress
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =========== Approval enforcement ===========
DROP POLICY IF EXISTS "dm_send_requires_approval" ON public.direct_messages;
CREATE POLICY "dm_send_requires_approval" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "submissions_requires_approval" ON public.submissions;
CREATE POLICY "submissions_requires_approval" ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "hw_subs_requires_approval" ON public.homework_submissions;
CREATE POLICY "hw_subs_requires_approval" ON public.homework_submissions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "assignments_create_requires_approval" ON public.assignments;
CREATE POLICY "assignments_create_requires_approval" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_approved(auth.uid()) AND public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "homework_create_requires_approval" ON public.homework;
CREATE POLICY "homework_create_requires_approval" ON public.homework
  FOR INSERT TO authenticated
  WITH CHECK (public.is_approved(auth.uid()) AND public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "announcements_create_requires_approval" ON public.announcements;
CREATE POLICY "announcements_create_requires_approval" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (public.is_approved(auth.uid()) AND public.is_teacher_or_admin(auth.uid()));
