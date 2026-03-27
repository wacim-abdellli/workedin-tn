-- ============================================
-- NUCLEAR OPTION - Clean Slate Admin Fix
-- This removes ALL policies and creates ONLY what we need
-- ============================================

-- Step 1: Make you admin (again, just to be sure)
UPDATE public.profiles
SET is_admin = true
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 2: Create or replace the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Step 3: DROP EVERY SINGLE POLICY ON PROFILES TABLE
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 4: DROP EVERY SINGLE POLICY ON OTHER ADMIN TABLES
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('jobs', 'contracts', 'proposals', 'identity_verifications', 'wallets', 'disputes', 'reports', 'notifications')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
        RAISE NOTICE 'Dropped policy: % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- Step 5: Create SIMPLE, CLEAN policies for profiles
-- Everyone can view profiles
CREATE POLICY "profiles_select_public"
ON public.profiles 
FOR SELECT 
TO public
USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update their own profile OR admins can update any
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id OR is_admin())
WITH CHECK (auth.uid() = id OR is_admin());

-- Only admins can delete profiles
CREATE POLICY "profiles_delete_admin_only"
ON public.profiles 
FOR DELETE 
TO authenticated
USING (is_admin());

-- Step 6: Create SIMPLE admin policies for other tables
-- JOBS
CREATE POLICY "jobs_select_all"
ON public.jobs FOR SELECT TO public USING (true);

CREATE POLICY "jobs_admin_all"
ON public.jobs FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- CONTRACTS
CREATE POLICY "contracts_select_involved"
ON public.contracts FOR SELECT TO authenticated
USING (client_id = auth.uid() OR freelancer_id = auth.uid() OR is_admin());

CREATE POLICY "contracts_admin_all"
ON public.contracts FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- PROPOSALS
CREATE POLICY "proposals_select_involved"
ON public.proposals FOR SELECT TO authenticated
USING (freelancer_id = auth.uid() OR is_admin());

CREATE POLICY "proposals_admin_all"
ON public.proposals FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- IDENTITY_VERIFICATIONS
CREATE POLICY "verifications_select_own_or_admin"
ON public.identity_verifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "verifications_admin_all"
ON public.identity_verifications FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- WALLETS
CREATE POLICY "wallets_select_own_or_admin"
ON public.wallets FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "wallets_admin_all"
ON public.wallets FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- DISPUTES
CREATE POLICY "disputes_select_involved_or_admin"
ON public.disputes FOR SELECT TO authenticated
USING (opened_by = auth.uid() OR is_admin());

CREATE POLICY "disputes_admin_all"
ON public.disputes FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Step 7: Verify your admin status
SELECT 
  'Your admin status:' as info,
  id, 
  email, 
  is_admin,
  CASE 
    WHEN is_admin = true THEN '✅ You are admin'
    ELSE '❌ NOT ADMIN - Something went wrong'
  END as status
FROM public.profiles 
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 8: Test if you can count records
SELECT 'Test: Count profiles' as test, COUNT(*) as count FROM public.profiles;
SELECT 'Test: Count jobs' as test, COUNT(*) as count FROM public.jobs;
SELECT 'Test: Count contracts' as test, COUNT(*) as count FROM public.contracts;

-- Step 9: List all policies (should be clean now)
SELECT 
  'Final policies:' as info,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'jobs', 'contracts', 'proposals', 'identity_verifications', 'wallets', 'disputes')
ORDER BY tablename, policyname;
