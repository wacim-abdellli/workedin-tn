-- Fix: treat NULL account_status as 'active' so existing users without the column set
-- are not blocked from writing to their profiles during onboarding.

CREATE OR REPLACE FUNCTION public.is_account_active(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT account_status IS NULL OR account_status = 'active'
      FROM public.profiles
      WHERE id = p_user_id
    ),
    true
  );
$$;

NOTIFY pgrst, 'reload schema';
