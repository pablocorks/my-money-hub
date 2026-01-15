-- Create app_settings table for storing the single user credentials
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_first_login boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read (for login verification)
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to update (for password change after first login)
CREATE POLICY "Anyone can update app settings"
  ON public.app_settings
  FOR UPDATE
  USING (true);

-- Insert the default user
INSERT INTO public.app_settings (username, password_hash, is_first_login)
VALUES ('familiacarneiroxavier', '12345', true);

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();