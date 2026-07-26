CREATE OR REPLACE FUNCTION public.check_ai_quota(_school_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _per_user_cap integer;
  _daily_cap integer;
  _today_user_count integer;
  _today_school_count integer;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  SELECT COALESCE(per_user_daily_cap, 30), COALESCE(daily_generation_cap, 200)
    INTO _per_user_cap, _daily_cap
    FROM public.ai_quotas WHERE school_id IS NOT DISTINCT FROM _school_id LIMIT 1;
  _per_user_cap := COALESCE(_per_user_cap, 30);
  _daily_cap := COALESCE(_daily_cap, 200);

  SELECT count(*) INTO _today_user_count FROM public.ai_generation_logs
   WHERE user_id = _uid AND created_at >= date_trunc('day', now());
  IF _today_user_count >= _per_user_cap THEN RETURN false; END IF;

  IF _school_id IS NOT NULL THEN
    SELECT count(*) INTO _today_school_count FROM public.ai_generation_logs l
     WHERE l.school_id = _school_id AND l.created_at >= date_trunc('day', now());
    IF _today_school_count >= _daily_cap THEN RETURN false; END IF;
  END IF;
  RETURN true;
END; $function$;