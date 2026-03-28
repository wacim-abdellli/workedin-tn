-- ============================================
-- COMPREHENSIVE ADMIN DASHBOARD FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Verify and set admin status for the user
UPDATE public.profiles
SET is_admin = true
WHERE email = 'wacimabdelli01@gmail.com'
RETURNING id, email, is_admin;

-- Step 2: Create is_admin() function with proper security
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Step 4: Drop ALL existing policies on key tables
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'jobs', 'contracts', 'proposals', 'disputes', 'notifications', 'identity_verifications')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Step 5: Create SIMPLE policies that work with auth
-- Profiles: Everyone can view, users can update own, admins can do anything
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (is_admin());

-- Jobs: Public can view open jobs, owners and admins can manage
CREATE POLICY "jobs_select_all" ON public.jobs FOR SELECT TO authenticated USING (
    visibility = 'public' OR client_id = auth.uid() OR is_admin()
);
CREATE POLICY "jobs_insert" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id OR is_admin());
CREATE POLICY "jobs_update" ON public.jobs FOR UPDATE TO authenticated USING (client_id = auth.uid() OR is_admin());
CREATE POLICY "jobs_delete" ON public.jobs FOR DELETE TO authenticated USING (client_id = auth.uid() OR is_admin());

-- Contracts: Involved parties and admins can view
CREATE POLICY "contracts_select_all" ON public.contracts FOR SELECT TO authenticated USING (
    client_id = auth.uid() OR freelancer_id = auth.uid() OR is_admin()
);
CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid() OR is_admin());
CREATE POLICY "contracts_update_all" ON public.contracts FOR UPDATE TO authenticated USING (
    client_id = auth.uid() OR freelancer_id = auth.uid() OR is_admin()
);
CREATE POLICY "contracts_delete_admin" ON public.contracts FOR DELETE TO authenticated USING (is_admin());

-- Disputes: Involved parties and admins can view
CREATE POLICY "disputes_select_all" ON public.disputes FOR SELECT TO authenticated USING (
    opened_by = auth.uid() OR is_admin()
);
CREATE POLICY "disputes_insert" ON public.disputes FOR INSERT TO authenticated WITH CHECK (opened_by = auth.uid() OR is_admin());
CREATE POLICY "disputes_update_admin" ON public.disputes FOR UPDATE TO authenticated USING (is_admin());

-- Notifications: Own + admins
CREATE POLICY "notifications_select_all" ON public.notifications FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR is_admin()
);
CREATE POLICY "notifications_update_all" ON public.notifications FOR UPDATE TO authenticated USING (
    user_id = auth.uid() OR is_admin()
);
CREATE POLICY "notifications_delete_all" ON public.notifications FOR DELETE TO authenticated USING (
    user_id = auth.uid() OR is_admin()
);

-- Identity Verifications: Own + admins
CREATE POLICY "identity_verifications_select_all" ON public.identity_verifications FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR is_admin()
);
CREATE POLICY "identity_verifications_update_admin" ON public.identity_verifications FOR UPDATE TO authenticated USING (is_admin());

-- Step 6: Create index for faster is_admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(id, is_admin) WHERE is_admin = true;

-- Step 7: Test queries - these should all return results
SELECT '=== Testing Admin Access ===' as test;

-- Test 1: Admin status
SELECT 
    'Admin status check' as test,
    (SELECT is_admin()) as is_admin_result,
    auth.uid() as current_user_id;

-- Test 2: Profile count (should be > 0)
SELECT 'Profiles table' as test, COUNT(*) as count FROM public.profiles;

-- Test 3: Jobs count (should be > 0)
SELECT 'Jobs table' as test, COUNT(*) as count FROM public.jobs;

-- Test 4: Contracts count (may be 0 if no contracts)
SELECT 'Contracts table' as test, COUNT(*) as count FROM public.contracts;

-- Test 5: Check your admin profile
SELECT 
    'Your profile' as test,
    id,
    email,
    full_name,
    is_admin
FROM public.profiles 
WHERE email = 'wacimabdelli01@gmail.com';

-- Test 6: List all current policies
SELECT 
    'Current policies' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
