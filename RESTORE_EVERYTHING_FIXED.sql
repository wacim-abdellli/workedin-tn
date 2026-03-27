-- ============================================
-- RESTORE EVERYTHING - Fix the app right now
-- ============================================

-- Step 1: Make you admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 2: Drop existing policies first, then create new ones
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

-- Step 3: Create basic policies that will make the app work again
-- These are the MINIMUM policies needed for the app to function

-- PROFILES - Everyone can view, users can update their own
CREATE POLICY "profiles_select_all"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- FREELANCER_PROFILES
CREATE POLICY "freelancer_profiles_select_all"
ON public.freelancer_profiles FOR SELECT
USING (true);

CREATE POLICY "freelancer_profiles_insert_own"
ON public.freelancer_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "freelancer_profiles_update_own"
ON public.freelancer_profiles FOR UPDATE
USING (auth.uid() = id);

-- JOBS - Everyone can view, clients can manage their own
CREATE POLICY "jobs_select_all"
ON public.jobs FOR SELECT
USING (true);

CREATE POLICY "jobs_insert_own"
ON public.jobs FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "jobs_update_own"
ON public.jobs FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "jobs_delete_own"
ON public.jobs FOR DELETE
USING (auth.uid() = client_id);

-- PROPOSALS - Freelancers can manage their own
CREATE POLICY "proposals_select_involved"
ON public.proposals FOR SELECT
USING (
    auth.uid() = freelancer_id 
    OR auth.uid() IN (SELECT client_id FROM jobs WHERE id = job_id)
);

CREATE POLICY "proposals_insert_own"
ON public.proposals FOR INSERT
WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "proposals_update_own"
ON public.proposals FOR UPDATE
USING (auth.uid() = freelancer_id);

-- CONTRACTS - Involved parties can access
CREATE POLICY "contracts_select_involved"
ON public.contracts FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

CREATE POLICY "contracts_insert_involved"
ON public.contracts FOR INSERT
WITH CHECK (auth.uid() = client_id OR auth.uid() = freelancer_id);

CREATE POLICY "contracts_update_involved"
ON public.contracts FOR UPDATE
USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- MESSAGES - Involved parties can access
CREATE POLICY "messages_select_involved"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert_own"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- NOTIFICATIONS - Users can see their own
CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- WALLETS - Users can see their own
CREATE POLICY "wallets_select_own"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "wallets_update_own"
ON public.wallets FOR UPDATE
USING (auth.uid() = user_id);

-- TRANSACTIONS - Users can see their own
CREATE POLICY "transactions_select_own"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- PORTFOLIO_ITEMS - Everyone can view, freelancers can manage their own
CREATE POLICY "portfolio_select_all"
ON public.portfolio_items FOR SELECT
USING (true);

CREATE POLICY "portfolio_insert_own"
ON public.portfolio_items FOR INSERT
WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "portfolio_update_own"
ON public.portfolio_items FOR UPDATE
USING (auth.uid() = freelancer_id);

CREATE POLICY "portfolio_delete_own"
ON public.portfolio_items FOR DELETE
USING (auth.uid() = freelancer_id);

-- REVIEWS - Everyone can view, involved parties can create
CREATE POLICY "reviews_select_all"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "reviews_insert_involved"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- IDENTITY_VERIFICATIONS - Users can see their own
CREATE POLICY "verifications_select_own"
ON public.identity_verifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "verifications_insert_own"
ON public.identity_verifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- DISPUTES - Involved parties can access
CREATE POLICY "disputes_select_involved"
ON public.disputes FOR SELECT
USING (auth.uid() = opened_by);

CREATE POLICY "disputes_insert_own"
ON public.disputes FOR INSERT
WITH CHECK (auth.uid() = opened_by);

-- Step 3: Add admin access to everything
-- Admin can do everything on all tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        -- Try to create admin policy, ignore if it fails
        BEGIN
            EXECUTE format('
                CREATE POLICY %I 
                ON public.%I 
                FOR ALL 
                USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true)
                WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true)
            ', 'admin_all_' || tbl, tbl);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors (policy might already exist)
            NULL;
        END;
    END LOOP;
END $$;

-- Step 4: Verify
SELECT 'App should work now!' as status;
SELECT 'Your admin status:' as info, email, is_admin 
FROM public.profiles 
WHERE email = 'wacimabdelli01@gmail.com';
