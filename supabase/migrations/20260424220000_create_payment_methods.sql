-- ============================================================
-- Migration: create_payment_methods
-- Creates the payment_methods table used by Settings > Payment.
-- The table was referenced in Settings.tsx but was never created,
-- causing every query to fail with "relation does not exist".
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id          uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid            NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type        text            NOT NULL CHECK (type IN ('d17', 'flouci', 'bank_transfer')),
  details     text            NOT NULL,
  is_default  boolean         NOT NULL DEFAULT false,
  created_at  timestamptz     NOT NULL DEFAULT now(),
  updated_at  timestamptz     NOT NULL DEFAULT now()
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON public.payment_methods (user_id);

-- Keep updated_at in sync
CREATE OR REPLACE FUNCTION public.touch_payment_methods_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.touch_payment_methods_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can only read their own payment methods
DROP POLICY IF EXISTS "payment_methods_select_own" ON public.payment_methods;
CREATE POLICY "payment_methods_select_own"
  ON public.payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payment methods
DROP POLICY IF EXISTS "payment_methods_insert_own" ON public.payment_methods;
CREATE POLICY "payment_methods_insert_own"
  ON public.payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment methods (e.g. change is_default)
DROP POLICY IF EXISTS "payment_methods_update_own" ON public.payment_methods;
CREATE POLICY "payment_methods_update_own"
  ON public.payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own payment methods
DROP POLICY IF EXISTS "payment_methods_delete_own" ON public.payment_methods;
CREATE POLICY "payment_methods_delete_own"
  ON public.payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- ── Role grants ─────────────────────────────────────────────
-- RLS policies alone are not enough: the role must also have
-- GRANT-level access or every query is rejected before RLS runs.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT SELECT ON public.payment_methods TO anon;
