
-- 1. Add email + approved columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- 2. Backfill emails from auth.users
UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. Auto-approve existing admins/teachers and the seeded admin
UPDATE public.profiles
  SET approved = true
  WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin','teacher'));

-- 4. Update handle_new_user trigger to also store email + leave approved=false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    NEW.email,
    false
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END; $$;

-- Make sure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS: admins can view/update/delete any profile
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Allow users to read their own approved status (already covered by "Users view own profile")

-- 7. Function for admin to delete a user fully (auth + profile + roles)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target;
  DELETE FROM public.profiles WHERE user_id = _target;
  DELETE FROM auth.users WHERE id = _target;
END; $$;

-- 8. Function for admin to approve a user
CREATE OR REPLACE FUNCTION public.admin_set_approved(_target uuid, _approved boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;
  UPDATE public.profiles SET approved = _approved, updated_at = now() WHERE user_id = _target;
END; $$;

-- 9. Function for admin to update display name
CREATE OR REPLACE FUNCTION public.admin_update_profile(_target uuid, _display_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update profiles';
  END IF;
  UPDATE public.profiles SET display_name = _display_name, updated_at = now() WHERE user_id = _target;
END; $$;
