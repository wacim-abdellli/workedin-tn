ALTER TABLE public.profiles
  ALTER COLUMN active_mode SET DEFAULT 'client';

UPDATE public.profiles
SET active_mode = 'client'
WHERE active_mode IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_active_mode
  ON public.profiles (id, active_mode);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_type_check
  CHECK (user_type IN ('client', 'freelancer', 'both'));
