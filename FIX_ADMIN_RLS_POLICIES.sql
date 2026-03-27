-- ============================================
-- FIX ADMIN RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- First, make sure you're an admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'wacimabdelli01@gmail.com';  -- CHANGE THIS TO YOUR EMAIL!

-- Verify the is_admin function exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES TABLE - Admin can see all
-- ============================================
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
CREATE POLICY "admin_all_profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ============================================
-- JOBS TABLE - Admin can see all
-- ============================================
DROP POLICY IF EXISTS "admin_all_jobs" ON public.jobs;
CREATE POLICY "admin_all_jobs" 
ON public.jobs 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ============================================
-- CONTRACTS TABLE - Admin can see all
-- ============================================
DROP POLICY IF EXISTS "admin_all_contracts" ON public.contracts;
CREATE POLICY "admin_all_contracts" 
ON public.contracts 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ============================================
-- PROPOSALS TABLE - Admin can see all
-- ============================================
DROP POLICY IF EXISTS "admin_all_proposals" ON public.proposals;
CREATE POLICY "admin_all_proposals" 
ON public.proposals 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ============================================
-- IDENTITY_VERIFICATIONS TABLE - Admin can see all
-- ============================================
DROP POLICY IF EXISTS "admin_all_identity_verifications" ON public.identity_verifications;
CREATE POLICY "admin_all_identity_verifications" 
ON public.identity_verifications 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ============================================
-- WALLETS TABLE - Admin can see all
-- ============================================
DROP POLICY IF EXISTS "admin_all_wallets" ON public.wallets;
CREATE POLICY "admin_all_wallets" 
ON public.wallets 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ============================================
-- DISPUTES TABLE - Admin can see all
-- ============================================
DROP POLICY IF EXISTS "admin_all_disputes" ON public.disputes;
CREATE POLICY "admin_all_disputes" 
ON public.disputes 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ============================================
-- REPORTS TABLE - Admin can see all
-- ============================================
DROP POLICY IF EXISTS "admin_all_reports" ON public.reports;
CREATE POLICY "admin_all_reports" 
ON public.reports 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ============================================
-- NOTIFICATIONS TABLE - Admin can see all
-- ============================================
DROP POLICY IF EXISTS "admin_all_notifications" ON public.notifications;
CREATE POLICY "admin_all_notifications" 
ON public.notifications 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- ============================================
-- VERIFY IT WORKED
-- ============================================
SELECT 
    'Admin user check' as test,
    id, 
    email, 
    is_admin 
FROM public.profiles 
WHERE email = 'wacimabdelli01@gmail.com';  -- CHANGE THIS TO YOUR EMAIL!

-- Test if is_admin() function works
SELECT 
    'is_admin() function test' as test,
    public.is_admin() as am_i_admin;

-- Count records (should work if you're admin)
SELECT 
    'Record counts' as test,
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.jobs) as total_jobs,
    (SELECT COUNT(*) FROM public.contracts) as total_contracts;
