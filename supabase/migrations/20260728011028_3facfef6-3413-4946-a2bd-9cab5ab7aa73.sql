
DROP POLICY IF EXISTS notif_insert_authenticated ON public.notifications;

CREATE POLICY notif_insert_self ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.send_notification(
  _user_ids uuid[],
  _type text,
  _title text,
  _body text DEFAULT NULL,
  _link text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _allowed uuid[];
  _count integer := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _user_ids IS NULL OR array_length(_user_ids, 1) IS NULL THEN RETURN 0; END IF;
  IF _title IS NULL OR length(trim(_title)) = 0 THEN RAISE EXCEPTION 'title_required'; END IF;
  IF length(_title) > 200 THEN RAISE EXCEPTION 'title_too_long'; END IF;
  IF _body IS NOT NULL AND length(_body) > 2000 THEN RAISE EXCEPTION 'body_too_long'; END IF;

  SELECT array_agg(DISTINCT t) INTO _allowed
  FROM unnest(_user_ids) AS t
  WHERE t = _uid
     OR public.has_role(_uid, 'admin')
     OR public.is_super_admin(_uid)
     OR public.users_share_school(_uid, t);

  IF _allowed IS NULL OR array_length(_allowed, 1) IS NULL THEN
    RAISE EXCEPTION 'not_authorized_to_notify';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  SELECT t, _type, _title, _body, _link, COALESCE(_metadata, '{}'::jsonb)
  FROM unnest(_allowed) AS t;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_notification(uuid[], text, text, text, text, jsonb) TO authenticated;
