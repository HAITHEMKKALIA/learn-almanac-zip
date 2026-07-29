
CREATE POLICY "school_logos_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'school-logos');

CREATE POLICY "school_logos_owner_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'school-logos'
  AND public.is_school_owner((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "school_logos_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'school-logos'
  AND public.is_school_owner((storage.foldername(name))[1]::uuid, auth.uid())
)
WITH CHECK (
  bucket_id = 'school-logos'
  AND public.is_school_owner((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "school_logos_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'school-logos'
  AND public.is_school_owner((storage.foldername(name))[1]::uuid, auth.uid())
);
