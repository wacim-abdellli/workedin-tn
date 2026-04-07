-- =============================================================================
-- MIGRATION: Harden jobs_insert RLS with user_type check
-- Fixes GAP-2 from Phase 5a audit.
--
-- Problem:
--   jobs_insert policy (20260325150000_fix_jobs_rls.sql:33-35) only checks
--   client_id = auth.uid(). It does NOT verify that the caller has user_type
--   IN ('client', 'both'). A freelancer-only account can create a job row by
--   calling the Supabase REST API directly, bypassing the /jobs/new frontend
--   workspace guard.
--
-- Fix:
--   Introduce a SECURITY DEFINER helper `caller_can_post_jobs()` that reads
--   the caller's user_type from profiles without triggering RLS recursion
--   (same pattern as is_job_owner() and is_admin() already in the codebase).
--   Drop the existing jobs_insert policy and recreate it with both constraints.
--
-- RLS recursion note:
--   The jobs table has an admin_all_jobs policy that calls is_admin(), which
--   queries profiles. If jobs_insert checked profiles inline via a subquery,
--   it could trigger the profiles RLS, which queries jobs — creating a loop.
--   Using a SECURITY DEFINER function avoids this, identical to is_job_owner().
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create SECURITY DEFINER helper: caller_can_post_jobs()
--    Returns TRUE if the authenticated caller has user_type 'client' or 'both'.
--    SECURITY DEFINER + locked search_path bypasses RLS on profiles (same
--    pattern as is_job_owner() in 20260325150000_fix_jobs_rls.sql:59-68).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.caller_can_post_jobs()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND user_type IN ('client', 'both')
    );
$$;

REVOKE ALL ON FUNCTION public.caller_can_post_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.caller_can_post_jobs() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Replace jobs_insert policy
--    Drop the existing policy, recreate with the additional user_type check.
--    The admin_all_jobs (FOR ALL) policy already covers admin insert, so this
--    policy targets non-admin authenticated users only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "jobs_insert" ON public.jobs;

CREATE POLICY "jobs_insert" ON public.jobs
    FOR INSERT
    WITH CHECK (
        auth.uid() = client_id
        AND public.caller_can_post_jobs()
    );

COMMENT ON FUNCTION public.caller_can_post_jobs IS
    'Returns TRUE if the caller has user_type = ''client'' or ''both''. '
    'Used in the jobs_insert RLS policy to prevent freelancer-only accounts '
    'from posting jobs via the API. SECURITY DEFINER to avoid RLS recursion '
    'on profiles. Same pattern as is_job_owner().';
