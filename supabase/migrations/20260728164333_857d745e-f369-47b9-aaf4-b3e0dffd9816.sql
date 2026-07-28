
-- Tighten INSERT: user cannot insert a row already marked approved
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE(approved, false) = false);

-- Tighten UPDATE: user cannot flip approved to true
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: block non-admins from changing approved column
CREATE OR REPLACE FUNCTION public.prevent_profile_self_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.is_super_admin(_uid) OR public.has_role(_uid, 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.approved, false) = true THEN
      NEW.approved := false;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.approved IS DISTINCT FROM OLD.approved THEN
      NEW.approved := OLD.approved;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_self_approval_trg ON public.profiles;
CREATE TRIGGER prevent_profile_self_approval_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_self_approval();
