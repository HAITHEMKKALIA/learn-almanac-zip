
-- Announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  class_id uuid NULL,
  scope text NOT NULL DEFAULT 'school' CHECK (scope IN ('school','class')),
  title text NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read school announcements"
ON public.announcements FOR SELECT TO authenticated
USING (
  scope = 'school'
  OR (scope = 'class' AND class_id IS NOT NULL AND (
    public.is_class_member(class_id, auth.uid())
    OR public.is_class_teacher(class_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  ))
);

CREATE POLICY "Teachers and admins create announcements"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id AND (
    public.is_teacher_or_admin(auth.uid())
  )
);

CREATE POLICY "Author can update/delete own announcement"
ON public.announcements FOR UPDATE TO authenticated
USING (auth.uid() = author_id);

CREATE POLICY "Author can delete own announcement"
ON public.announcements FOR DELETE TO authenticated
USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_announcements_upd
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Calendar events
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  class_id uuid NULL,
  title text NOT NULL,
  description text NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NULL,
  kind text NOT NULL DEFAULT 'event' CHECK (kind IN ('event','exam','homework','holiday')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read calendar (school or class)"
ON public.calendar_events FOR SELECT TO authenticated
USING (
  class_id IS NULL
  OR public.is_class_member(class_id, auth.uid())
  OR public.is_class_teacher(class_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Teachers create events"
ON public.calendar_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id AND public.is_teacher_or_admin(auth.uid()));

CREATE POLICY "Author updates events"
ON public.calendar_events FOR UPDATE TO authenticated
USING (auth.uid() = author_id);

CREATE POLICY "Author deletes events"
ON public.calendar_events FOR DELETE TO authenticated
USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_events_upd
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Direct messages (1-to-1)
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages"
ON public.direct_messages FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Sender can send"
ON public.direct_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipient can mark read"
ON public.direct_messages FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id);

CREATE INDEX idx_dm_pair ON public.direct_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_announce_created ON public.announcements (created_at DESC);
CREATE INDEX idx_events_starts ON public.calendar_events (starts_at);
