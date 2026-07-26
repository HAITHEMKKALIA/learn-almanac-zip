
DROP POLICY IF EXISTS "Authenticated upload chat" ON storage.objects;
CREATE POLICY "Authenticated upload chat" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = auth.uid()::text
);
