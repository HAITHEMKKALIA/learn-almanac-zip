
-- 1) Fix permissive RLS policies (always true) on user_progress and chat_history
DROP POLICY IF EXISTS "Anyone can insert chat" ON public.chat_history;
CREATE POLICY "Authenticated can insert chat"
ON public.chat_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert progress" ON public.user_progress;
CREATE POLICY "Authenticated can insert progress"
ON public.user_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can update progress" ON public.user_progress;
CREATE POLICY "Authenticated can update progress"
ON public.user_progress FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

-- 2) Storage: remove broad public SELECT policies that allow listing.
-- Public URLs (getPublicUrl) keep working without these policies.
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Public read chat" ON storage.objects;
DROP POLICY IF EXISTS "voice-uploads public read" ON storage.objects;

-- Keep narrow SELECT for owners (chat & avatars) so authenticated APIs still work for own files
CREATE POLICY "Avatar owner can read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Chat participants can read own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND owner = auth.uid());

-- 3) Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_assignment_lockdown() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_teacher_or_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.student_can_access_questions(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_approved(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_profile(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_class_by_code(text) FROM PUBLIC, anon;
