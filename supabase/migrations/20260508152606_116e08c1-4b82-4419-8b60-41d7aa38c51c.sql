-- Server-side enforcement of strict anti-cheat + shuffle on assignments
CREATE OR REPLACE FUNCTION public.enforce_assignment_lockdown()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Force shuffle and strict lockdown for every assignment
  NEW.shuffle_questions := true;
  NEW.lockdown_strict   := true;

  -- Ensure at least the core proctor controls are enabled when strict
  IF NEW.proctor_settings IS NULL OR jsonb_typeof(NEW.proctor_settings) <> 'object' THEN
    NEW.proctor_settings := '{}'::jsonb;
  END IF;
  NEW.proctor_settings := NEW.proctor_settings
    || jsonb_build_object(
      'tab_switch',    true,
      'copy_paste',    true,
      'block_context', true,
      'fullscreen',    true
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_assignment_lockdown ON public.assignments;
CREATE TRIGGER trg_enforce_assignment_lockdown
BEFORE INSERT OR UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.enforce_assignment_lockdown();

-- Backfill existing rows once
UPDATE public.assignments
SET shuffle_questions = true,
    lockdown_strict = true,
    proctor_settings = COALESCE(proctor_settings, '{}'::jsonb)
      || jsonb_build_object('tab_switch', true, 'copy_paste', true, 'block_context', true, 'fullscreen', true);
