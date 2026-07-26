
-- Drop any pre-existing voice-uploads policies
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE 'voice-uploads%' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END$$;

CREATE POLICY "voice-uploads_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'voice-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "voice-uploads_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'voice-uploads'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR public.teacher_can_view_student(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

CREATE POLICY "voice-uploads_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'voice-uploads'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
