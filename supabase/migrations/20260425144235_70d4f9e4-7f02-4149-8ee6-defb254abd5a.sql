-- Storage bucket for user voice recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-uploads',
  'voice-uploads',
  true,
  52428800, -- 50MB
  ARRAY['audio/webm','audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/x-m4a','audio/m4a','audio/aac']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "voice-uploads public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-uploads');

CREATE POLICY "voice-uploads public insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-uploads');

CREATE POLICY "voice-uploads public delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'voice-uploads');