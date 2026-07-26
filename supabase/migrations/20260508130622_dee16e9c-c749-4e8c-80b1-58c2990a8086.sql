
-- Extend direct_messages for WhatsApp-like features
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS reply_to_id uuid,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.direct_messages ALTER COLUMN body DROP NOT NULL;

-- Sender can update (edit/delete own message)
DROP POLICY IF EXISTS "Sender can update own message" ON public.direct_messages;
CREATE POLICY "Sender can update own message" ON public.direct_messages
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id);

-- Realtime
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated upload chat" ON storage.objects;
CREATE POLICY "Authenticated upload chat" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');
DROP POLICY IF EXISTS "Public read chat" ON storage.objects;
CREATE POLICY "Public read chat" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'chat-attachments');
DROP POLICY IF EXISTS "Owner delete chat" ON storage.objects;
CREATE POLICY "Owner delete chat" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-attachments' AND owner = auth.uid());
