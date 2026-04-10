-- Global write lock for suspended/archived accounts.
-- Applies at DB trigger layer so RPCs, direct table writes, and edge cases are all covered.

CREATE OR REPLACE FUNCTION public.is_account_active(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT account_status = 'active'
      FROM public.profiles
      WHERE id = p_user_id
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_active_account_for_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  -- Service role / backend processes (no JWT user) are allowed.
  IF v_actor IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Admin users keep moderation access.
  IF public.is_admin() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Allow initial profile bootstrap for the authenticated user.
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
    IF NEW.id = v_actor THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NOT public.is_account_active(v_actor) THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name text;
  target_tables text[] := ARRAY[
    'profiles',
    'freelancer_profiles',
    'portfolio_items',
    'jobs',
    'proposals',
    'contracts',
    'milestones',
    'conversations',
    'messages',
    'reviews',
    'withdrawals',
    'payment_methods',
    'transactions',
    'disputes'
  ];
BEGIN
  FOREACH table_name IN ARRAY target_tables
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_enforce_active_account_writes ON public.%I', table_name);
      EXECUTE format(
        'CREATE TRIGGER trg_enforce_active_account_writes BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_active_account_for_writes()',
        table_name
      );
    END IF;
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
