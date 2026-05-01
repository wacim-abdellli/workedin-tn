-- ============================================================
-- Migration: Add "Online for Messages" presence toggle
-- Adds a persistent user preference column so users can control
-- whether they appear online/available to receive messages.
-- Default is TRUE so all existing users appear online.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_online_for_messages boolean NOT NULL DEFAULT true;

-- Expose the column via the RLS-safe profile reads.
-- No extra policies needed — the column just follows the existing
-- profiles RLS (users can read their own row; others can read
-- public-visible profile fields via the existing SELECT policy).

COMMENT ON COLUMN public.profiles.is_online_for_messages IS
  'User-controlled toggle: TRUE means the user is willing to appear online and receive messages; FALSE means they appear offline globally.';
