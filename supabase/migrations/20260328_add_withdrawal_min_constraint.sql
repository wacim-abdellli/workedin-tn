-- Enforce withdrawal amount constraints and ownership RLS.

ALTER TABLE public.withdrawals
  DROP CONSTRAINT IF EXISTS withdrawals_amount_check,
  ADD CONSTRAINT withdrawals_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT withdrawals_amount_minimum CHECK (amount >= 20);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'withdrawals'
      AND policyname = 'users_insert_own_withdrawal'
  ) THEN
    EXECUTE 'CREATE POLICY "users_insert_own_withdrawal" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'withdrawals'
      AND policyname = 'users_read_own_withdrawal'
  ) THEN
    EXECUTE 'CREATE POLICY "users_read_own_withdrawal" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END
$$;
