
CREATE OR REPLACE FUNCTION public.join_class_by_code(_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _class_id uuid;
  _school_id uuid;
  _clean_code text := upper(trim(COALESCE(_code, '')));
  _existing_status text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.is_approved(_uid) THEN RAISE EXCEPTION 'profile_approval_required'; END IF;
  IF _clean_code = '' THEN RAISE EXCEPTION 'invalid_code'; END IF;

  SELECT c.id, c.school_id INTO _class_id, _school_id
  FROM public.classes c
  JOIN public.schools s ON s.id = c.school_id
  WHERE upper(c.invite_code) = _clean_code
    AND c.status IN ('open','active')
    AND s.status = 'active'
  LIMIT 1;
  IF _class_id IS NULL THEN RAISE EXCEPTION 'invalid_code'; END IF;

  SELECT status INTO _existing_status
  FROM public.school_members
  WHERE school_id = _school_id AND user_id = _uid
  ORDER BY joined_at ASC LIMIT 1;

  IF _existing_status = 'approved' THEN
    -- Already an approved member: directly add to class.
    INSERT INTO public.class_members(class_id, student_id)
    VALUES (_class_id, _uid)
    ON CONFLICT (class_id, student_id) DO NOTHING;
  ELSE
    INSERT INTO public.school_members(school_id, user_id, role, space_role, status, requested_class_id)
    VALUES (_school_id, _uid, 'student'::public.school_role, 'student'::public.app_role, 'pending', _class_id)
    ON CONFLICT (school_id, user_id, role) DO UPDATE SET
      status = 'pending',
      requested_class_id = EXCLUDED.requested_class_id,
      reviewed_at = NULL,
      review_reason = NULL;
  END IF;

  RETURN _class_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.school_review_membership(_school_id uuid, _user_id uuid, _decision text, _space_role text DEFAULT NULL::text, _class_id uuid DEFAULT NULL::uuid, _reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _membership public.school_members%ROWTYPE;
  _role public.app_role;
  _legacy public.school_role;
  _effective_class uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_super_admin(_uid) OR public.is_school_owner(_school_id, _uid)) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF _decision NOT IN ('approve','suspend','reactivate','reject') THEN
    RAISE EXCEPTION 'invalid_decision';
  END IF;

  SELECT * INTO _membership FROM public.school_members
  WHERE school_id = _school_id AND user_id = _user_id
  ORDER BY joined_at ASC LIMIT 1;
  IF _membership.id IS NULL THEN RAISE EXCEPTION 'membership_not_found'; END IF;

  IF _decision IN ('approve','reactivate') THEN
    _role := COALESCE(NULLIF(_space_role,'')::public.app_role, _membership.space_role, 'student'::public.app_role);
    IF _role = 'super_admin'::public.app_role THEN RAISE EXCEPTION 'super_admin_assignment_forbidden'; END IF;
    _legacy := CASE WHEN _role IN ('school_admin','academic_director','pedagogical_coordinator','examiner','teacher','staff')
      THEN 'teacher'::public.school_role ELSE 'student'::public.school_role END;

    _effective_class := COALESCE(_class_id, _membership.requested_class_id);

    UPDATE public.school_members
      SET status = 'approved',
          space_role = _role,
          role = _legacy,
          approved_by = _uid,
          approved_at = now(),
          reviewed_at = now(),
          review_reason = NULL,
          requested_class_id = _effective_class
    WHERE id = _membership.id;

    UPDATE public.profiles SET approved = true, updated_at = now() WHERE user_id = _user_id;
    INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF _effective_class IS NOT NULL AND _role = 'student'::public.app_role THEN
      IF NOT EXISTS (SELECT 1 FROM public.classes WHERE id = _effective_class AND school_id = _school_id) THEN
        RAISE EXCEPTION 'class_not_in_school';
      END IF;
      INSERT INTO public.class_members(class_id, student_id) VALUES (_effective_class, _user_id)
      ON CONFLICT (class_id, student_id) DO NOTHING;
    END IF;
  ELSIF _decision = 'suspend' THEN
    UPDATE public.school_members
      SET status = 'suspended', reviewed_at = now(), review_reason = NULLIF(trim(_reason),'')
    WHERE id = _membership.id;
  ELSIF _decision = 'reject' THEN
    UPDATE public.school_members
      SET status = 'rejected', reviewed_at = now(), review_reason = NULLIF(trim(_reason),'')
    WHERE id = _membership.id;
  END IF;

  INSERT INTO public.audit_logs(actor_id, action, target_table, target_id, school_id, metadata)
  VALUES (_uid, 'school.review_membership', 'school_members', _membership.id, _school_id,
    jsonb_build_object('decision', _decision, 'user_id', _user_id, 'space_role', _space_role, 'class_id', _effective_class, 'reason', _reason));
END;
$function$;
