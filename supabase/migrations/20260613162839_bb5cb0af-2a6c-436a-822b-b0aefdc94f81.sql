
-- 1) Prevent client-side audit log spoofing
DROP POLICY IF EXISTS "audit self insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_self_insert" ON public.audit_logs;

-- 2) Allow chat attachment recipients to read files referenced in direct messages they received
DROP POLICY IF EXISTS "Chat recipients can read attachments" ON storage.objects;
CREATE POLICY "Chat recipients can read attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM public.direct_messages dm
    WHERE dm.recipient_id = auth.uid()
      AND dm.attachment_url LIKE '%' || storage.objects.name
  )
);
