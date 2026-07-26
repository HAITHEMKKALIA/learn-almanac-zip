-- 1. Profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male','female','other')),
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS avatar_style text DEFAULT 'auto';

-- 2. Class attendance
CREATE TABLE IF NOT EXISTS public.class_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  student_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
  note text,
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id, session_date)
);

ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher manage attendance" ON public.class_attendance
  FOR ALL USING (public.is_class_teacher(class_id, auth.uid()))
  WITH CHECK (public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Student view own attendance" ON public.class_attendance
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admin all attendance" ON public.class_attendance
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_attendance_updated
BEFORE UPDATE ON public.class_attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.class_attendance(class_id, session_date);

-- 3. Proctor settings on assignments
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS proctor_settings jsonb NOT NULL DEFAULT jsonb_build_object(
    'tab_switch', true,
    'copy_paste', true,
    'fullscreen', true,
    'block_context', true,
    'multi_screen', false,
    'webcam_snapshots', false,
    'snapshot_interval', 30
  );

-- 4. Avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars publicly readable"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Realtime for attendance + exam_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_events;