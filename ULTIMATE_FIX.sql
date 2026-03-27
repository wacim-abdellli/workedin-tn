-- ============================================
-- ULTIMATE FIX - No Recursion, No Timeouts
-- This uses a simpler approach without the is_admin() function
-- ============================================

-- Step 1: Make you admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 2: Drop ALL policies on all tables FIRST (before dropping the function)
-- This is required because policies depend on the is_admin() function
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Step 3: NOW drop the is_admin() function (after policies are gone)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Step 4: Create SIMPLE policies without function calls
-- These policies check is_admin directly in the query (no function = no recursion)

-- PROFILES
CREATE POLICY "profiles_select_all"
ON public.profiles FOR SELECT
USING (true);  -- Everyone can view profiles

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE
USING (
    auth.uid() = id 
    OR 
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "profiles_delete_admin"
ON public.profiles FOR DELETE
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- JOBS
CREATE POLICY "jobs_select_all"
ON public.jobs FOR SELECT
USING (true);

CREATE POLICY "jobs_insert_own"
ON public.jobs FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY "jobs_update_own_or_admin"
ON public.jobs FOR UPDATE
USING (
    client_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "jobs_delete_own_or_admin"
ON public.jobs FOR DELETE
USING (
    client_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- CONTRACTS
CREATE POLICY "contracts_select_involved_or_admin"
ON public.contracts FOR SELECT
USING (
    client_id = auth.uid() 
    OR freelancer_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "contracts_insert_involved"
ON public.contracts FOR INSERT
WITH CHECK (client_id = auth.uid() OR freelancer_id = auth.uid());

CREATE POLICY "contracts_update_involved_or_admin"
ON public.contracts FOR UPDATE
USING (
    client_id = auth.uid() 
    OR freelancer_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "contracts_delete_admin"
ON public.contracts FOR DELETE
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- PROPOSALS
CREATE POLICY "proposals_select_involved_or_admin"
ON public.proposals FOR SELECT
USING (
    freelancer_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "proposals_insert_own"
ON public.proposals FOR INSERT
WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "proposals_update_own_or_admin"
ON public.proposals FOR UPDATE
USING (
    freelancer_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "proposals_delete_own_or_admin"
ON public.proposals FOR DELETE
USING (
    freelancer_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- IDENTITY_VERIFICATIONS
CREATE POLICY "verifications_select_own_or_admin"
ON public.identity_verifications FOR SELECT
USING (
    user_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "verifications_insert_own"
ON public.identity_verifications FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "verifications_update_admin"
ON public.identity_verifications FOR UPDATE
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "verifications_delete_admin"
ON public.identity_verifications FOR DELETE
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- WALLETS
CREATE POLICY "wallets_select_own_or_admin"
ON public.wallets FOR SELECT
USING (
    user_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "wallets_insert_own"
ON public.wallets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "wallets_update_own_or_admin"
ON public.wallets FOR UPDATE
USING (
    user_id = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "wallets_delete_admin"
ON public.wallets FOR DELETE
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- DISPUTES
CREATE POLICY "disputes_select_involved_or_admin"
ON public.disputes FOR SELECT
USING (
    opened_by = auth.uid()
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "disputes_insert_involved"
ON public.disputes FOR INSERT
WITH CHECK (opened_by = auth.uid());

CREATE POLICY "disputes_update_admin"
ON public.disputes FOR UPDATE
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "disputes_delete_admin"
ON public.disputes FOR DELETE
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Step 5: Verify
SELECT 
  'Your admin status:' as info,
  id, 
  email, 
  is_admin
FROM public.profiles 
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 6: Test counts (should work now without timeout)
SELECT 'Profiles count:' as test, COUNT(*) FROM public.profiles;
SELECT 'Jobs count:' as test, COUNT(*) FROM public.jobs;
SELECT 'Contracts count:' as test, COUNT(*) FROM public.contracts;

SELECT '✅ DONE! Now log out, clear cache, and log back in.' as final_message;
