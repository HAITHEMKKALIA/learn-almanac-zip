CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text NOT NULL DEFAULT 'Deutsch Meister',
  platform_logo_url text,
  support_email text,
  default_language text NOT NULL DEFAULT 'fr',
  default_timezone text NOT NULL DEFAULT 'Europe/Paris',
  maintenance_mode boolean NOT NULL DEFAULT false,
  global_ai_quota_daily integer NOT NULL DEFAULT 200,
  terms_url text,
  privacy_url text,
  extra jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage platform settings"
ON public.platform_settings
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();