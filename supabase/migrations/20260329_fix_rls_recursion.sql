-- =========================================================================
-- FIX INFINITE RECURSION ON PROFILES RLS
-- =========================================================================

-- 1. Create a security definer function to check admin status
-- This bypasses RLS when checking the profiles table to prevent the loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Drop the recursive policy on profiles
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;

-- 3. Recreate the policy using the security definer function
CREATE POLICY "admin_all_profiles"
ON public.profiles FOR ALL 
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- Note: Other tables (jobs, contracts, etc.) DO NOT have infinite recursion
-- because their policies query the profiles table, not themselves.
-- However, we can update them to use the safe is_admin() function for performance!

DROP POLICY IF EXISTS "admin_all_jobs" ON public.jobs;
CREATE POLICY "admin_all_jobs" ON public.jobs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_contracts" ON public.contracts;
CREATE POLICY "admin_all_contracts" ON public.contracts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_proposals" ON public.proposals;
CREATE POLICY "admin_all_proposals" ON public.proposals FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_identity_verifications" ON public.identity_verifications;
CREATE POLICY "admin_all_identity_verifications" ON public.identity_verifications FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_wallets" ON public.wallets;
CREATE POLICY "admin_all_wallets" ON public.wallets FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
