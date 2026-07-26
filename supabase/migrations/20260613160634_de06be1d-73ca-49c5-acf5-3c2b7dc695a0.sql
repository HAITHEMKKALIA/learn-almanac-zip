
DROP POLICY IF EXISTS "own xp insert" ON public.xp_events;
DROP POLICY IF EXISTS "own badges insert" ON public.user_badges;

DROP POLICY IF EXISTS "own stats read" ON public.user_stats;
CREATE POLICY "own stats read" ON public.user_stats FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.teacher_can_view_student(auth.uid(), user_id));

DROP POLICY IF EXISTS "own xp read" ON public.xp_events;
CREATE POLICY "own xp read" ON public.xp_events FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.teacher_can_view_student(auth.uid(), user_id));

DROP POLICY IF EXISTS "own badges read" ON public.user_badges;
CREATE POLICY "own badges read" ON public.user_badges FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.teacher_can_view_student(auth.uid(), user_id));

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;

UPDATE public.announcements a SET school_id = sub.school_id
FROM (SELECT DISTINCT ON (user_id) user_id, school_id FROM public.school_members ORDER BY user_id, role DESC) sub
WHERE a.school_id IS NULL AND sub.user_id = a.author_id;

UPDATE public.calendar_events e SET school_id = sub.school_id
FROM (SELECT DISTINCT ON (user_id) user_id, school_id FROM public.school_members ORDER BY user_id, role DESC) sub
WHERE e.school_id IS NULL AND sub.user_id = e.author_id;

DROP POLICY IF EXISTS "Anyone authenticated can read school announcements" ON public.announcements;
CREATE POLICY "Read scoped announcements" ON public.announcements FOR SELECT TO authenticated
USING (
  (scope = 'school' AND school_id IS NOT NULL AND (public.is_school_member(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin')))
  OR (scope = 'class' AND class_id IS NOT NULL AND (public.is_class_member(class_id, auth.uid()) OR public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')))
  OR author_id = auth.uid()
);

DROP POLICY IF EXISTS "Read calendar (school or class)" ON public.calendar_events;
CREATE POLICY "Read calendar scoped" ON public.calendar_events FOR SELECT TO authenticated
USING (
  (class_id IS NOT NULL AND (public.is_class_member(class_id, auth.uid()) OR public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')))
  OR (class_id IS NULL AND school_id IS NOT NULL AND (public.is_school_member(school_id, auth.uid()) OR public.has_role(auth.uid(),'admin')))
  OR author_id = auth.uid()
);

REVOKE EXECUTE ON FUNCTION public.admin_assign_user(uuid, uuid, app_role, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_create_class(uuid, text, text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_remove_from_class(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_approved(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_update_profile(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.award_xp(text, integer, uuid, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_ai_quota(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.class_progress_report(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.issue_certificate(uuid, uuid, uuid, numeric, uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.join_class_by_code(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_audit(text, text, uuid, uuid, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.my_schools() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.promote_students(uuid[], uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.school_members_full(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.student_full_report(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_class_roster(uuid) FROM anon, public;
