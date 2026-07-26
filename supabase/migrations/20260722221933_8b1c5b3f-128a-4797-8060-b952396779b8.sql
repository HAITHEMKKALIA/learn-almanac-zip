-- Virtual rooms
CREATE TABLE public.virtual_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  host_id uuid NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'live',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.virtual_rooms TO authenticated;
GRANT ALL ON public.virtual_rooms TO service_role;

ALTER TABLE public.virtual_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_school_members" ON public.virtual_rooms
  FOR SELECT TO authenticated
  USING (
    host_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (school_id IS NOT NULL AND public.is_school_member(school_id, auth.uid()))
  );

CREATE POLICY "rooms_insert_teacher" ON public.virtual_rooms
  FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid()
    AND (
      public.has_role(auth.uid(),'admin')
      OR public.is_teacher_or_admin(auth.uid())
      OR (school_id IS NOT NULL AND public.is_school_teacher(school_id, auth.uid()))
    )
  );

CREATE POLICY "rooms_update_host" ON public.virtual_rooms
  FOR UPDATE TO authenticated
  USING (host_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (host_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "rooms_delete_host" ON public.virtual_rooms
  FOR DELETE TO authenticated
  USING (host_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER virtual_rooms_updated
  BEFORE UPDATE ON public.virtual_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Room messages
CREATE TABLE public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.virtual_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;

ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_msg_select" ON public.room_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_rooms r
      WHERE r.id = room_messages.room_id
        AND (
          r.host_id = auth.uid()
          OR public.has_role(auth.uid(),'admin')
          OR (r.school_id IS NOT NULL AND public.is_school_member(r.school_id, auth.uid()))
        )
    )
  );

CREATE POLICY "room_msg_insert" ON public.room_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.virtual_rooms r
      WHERE r.id = room_messages.room_id
        AND r.status = 'live'
        AND (
          r.host_id = auth.uid()
          OR public.has_role(auth.uid(),'admin')
          OR (r.school_id IS NOT NULL AND public.is_school_member(r.school_id, auth.uid()))
        )
    )
  );

CREATE POLICY "room_msg_delete_own_or_host" ON public.room_messages
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.virtual_rooms r WHERE r.id = room_messages.room_id AND r.host_id = auth.uid())
  );

CREATE INDEX room_messages_room_idx ON public.room_messages(room_id, created_at);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;