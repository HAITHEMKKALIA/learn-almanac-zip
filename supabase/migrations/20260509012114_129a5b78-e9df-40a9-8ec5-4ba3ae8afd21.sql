CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users view own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Teachers view class student presence" ON public.user_presence;
DROP POLICY IF EXISTS "Admins view all presence" ON public.user_presence;

CREATE POLICY "Users manage own presence"
ON public.user_presence
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own presence"
ON public.user_presence
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Teachers view class student presence"
ON public.user_presence
FOR SELECT
TO authenticated
USING (public.teacher_can_view_student(auth.uid(), user_id));

CREATE POLICY "Admins view all presence"
ON public.user_presence
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
  END IF;
END $$;