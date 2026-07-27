
-- School-scoped membership management (owner-only)
CREATE OR REPLACE FUNCTION public.school_review_membership(
  _school_id uuid,
  _user_id uuid,
  _decision text,
  _space_role text DEFAULT NULL,
  _class_id uuid DEFAULT NULL,
  _reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _membership public.school_members%ROWTYPE;
  _role public.app_role;
  _legacy public.school_role;
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

    UPDATE public.school_members
      SET status = 'approved',
          space_role = _role,
          role = _legacy,
          approved_by = _uid,
          approved_at = now(),
          reviewed_at = now(),
          review_reason = NULL,
          requested_class_id = COALESCE(_class_id, requested_class_id)
    WHERE id = _membership.id;

    UPDATE public.profiles SET approved = true, updated_at = now() WHERE user_id = _user_id;
    INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF _class_id IS NOT NULL AND _role = 'student'::public.app_role THEN
      IF NOT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND school_id = _school_id) THEN
        RAISE EXCEPTION 'class_not_in_school';
      END IF;
      INSERT INTO public.class_members(class_id, student_id) VALUES (_class_id, _user_id)
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
    jsonb_build_object('decision', _decision, 'user_id', _user_id, 'space_role', _space_role, 'class_id', _class_id, 'reason', _reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.school_remove_member(_school_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_super_admin(_uid) OR public.is_school_owner(_school_id, _uid)) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF _user_id = (SELECT owner_id FROM public.schools WHERE id = _school_id) THEN
    RAISE EXCEPTION 'cannot_remove_owner';
  END IF;

  DELETE FROM public.class_members cm
   USING public.classes c
   WHERE cm.class_id = c.id AND c.school_id = _school_id AND cm.student_id = _user_id;

  DELETE FROM public.school_members WHERE school_id = _school_id AND user_id = _user_id;

  INSERT INTO public.audit_logs(actor_id, action, target_table, target_id, school_id, metadata)
  VALUES (_uid, 'school.remove_member', 'school_members', NULL, _school_id,
    jsonb_build_object('user_id', _user_id));
END;
$$;

GRANT EXECUTE ON FUNCTION public.school_review_membership(uuid, uuid, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.school_remove_member(uuid, uuid) TO authenticated;
