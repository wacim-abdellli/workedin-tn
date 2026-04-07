-- ============================================================
-- Phase 5b (v2): Harden profiles exposure via a public-safe view
-- ============================================================
-- Problem:
--   profiles_select_all USING (true) allows anonymous callers to SELECT
--   all columns including: email, phone, is_admin, account_status,
--   cin_submitted, onboarding_completed.
--
-- Fix approach:
--   1. Create public.public_profiles — a view exposing only safe columns.
--   2. Grant SELECT on the view to anon + authenticated.
--   3. Tighten base table RLS: only owner and admin can read the base table.
--   4. Public pages (FindFreelancers, FreelancerProfile, ClientProfile)
--      switch to querying 'public_profiles' (the view) instead of 'profiles'.
--
-- Safe columns for the view:
--   id, full_name, username, avatar_url, bio, location,
--   user_type, active_mode, cin_verified, created_at, updated_at
--
-- NOT in the view (sensitive):
--   email, phone, is_admin, account_status, cin_submitted,
--   onboarding_completed, preferred_language
-- ============================================================

BEGIN;

-- ── 1. Drop the old Phase 5b migration (superseded by this one) ──────────────
-- Clean idempotently — these were created in the now-replaced migration.
DROP POLICY IF EXISTS "profiles_select_all"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"     ON public.profiles;
-- From SECURITY_FIX.sql (manual script, may or may not exist in live DB)
DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.profiles;

-- ── 2. Recreate scoped base-table RLS ────────────────────────────────────────

-- Owner reads all own columns (AuthContext, settings, onboarding)
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- admin_all_profiles already handles admin FOR ALL via is_admin().
-- Created in 20260329020000_fix_rls_recursion.sql — left intact.

-- NOTE: No public/authenticated SELECT policy on the base table.
--       All broad reads go through the view below.

-- ── 3. Create the public-safe view ───────────────────────────────────────────
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
    WITH (security_invoker = false)   -- view runs as the view owner (postgres)
AS
SELECT
    id,
    full_name,
    username,
    avatar_url,
    bio,
    location,
    user_type,
    active_mode,
    cin_verified,
    created_at,
    updated_at
FROM public.profiles;

-- ── 4. Grant view SELECT to anon and authenticated ───────────────────────────
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- ── 5. Enable RLS on the view itself (belt-and-suspenders) ───────────────────
-- Views in Postgres do not have RLS by default; the grants above are sufficient.
-- The underlying table's RLS does NOT apply when accessed through a non-SECURITY
-- INVOKER view owned by a superuser — which is why we rely on column restriction
-- at the view definition level instead.

-- ── 6. Ensure profiles table RLS is enabled ──────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMIT;
