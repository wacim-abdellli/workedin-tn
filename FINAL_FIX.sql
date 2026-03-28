-- FINAL FIX - ALL SELECT queries work WITHOUT auth
-- Run this in Supabase SQL Editor

-- Drop ALL policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Make ALL SELECT queries work WITHOUT auth (TO public)
-- Profiles
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "profiles_insert_auth" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Jobs
CREATE POLICY "jobs_select_all" ON public.jobs FOR SELECT TO public USING (true);
CREATE POLICY "jobs_insert_auth" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "jobs_update_own" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = client_id);

-- Contracts
CREATE POLICY "contracts_select_all" ON public.contracts FOR SELECT TO public USING (true);
CREATE POLICY "contracts_insert_auth" ON public.contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

-- Proposals
CREATE POLICY "proposals_select_all" ON public.proposals FOR SELECT TO public USING (true);
CREATE POLICY "proposals_insert_auth" ON public.proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = freelancer_id);

-- Disputes
CREATE POLICY "disputes_select_all" ON public.disputes FOR SELECT TO public USING (true);

-- Notifications
CREATE POLICY "notifications_select_all" ON public.notifications FOR SELECT TO public USING (true);

-- Identity Verifications
CREATE POLICY "identity_verifications_select_all" ON public.identity_verifications FOR SELECT TO public USING (true);

-- Wallets
CREATE POLICY "wallets_select_all" ON public.wallets FOR SELECT TO public USING (true);

-- Transactions
CREATE POLICY "transactions_select_all" ON public.transactions FOR SELECT TO public USING (true);

-- Withdrawals
CREATE POLICY "withdrawals_select_all" ON public.withdrawals FOR SELECT TO public USING (true);

-- Freelancer Profiles
CREATE POLICY "freelancer_profiles_select_all" ON public.freelancer_profiles FOR SELECT TO public USING (true);

-- Portfolio Items
CREATE POLICY "portfolio_items_select_all" ON public.portfolio_items FOR SELECT TO public USING (true);
CREATE POLICY "portfolio_items_manage_own" ON public.portfolio_items FOR ALL TO authenticated USING (auth.uid() = freelancer_id);

-- Messages
CREATE POLICY "messages_select_all" ON public.messages FOR SELECT TO public USING (true);

-- Reviews
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT TO public USING (true);

-- Favorites
CREATE POLICY "favorites_select_all" ON public.favorites FOR SELECT TO public USING (true);
CREATE POLICY "favorites_manage_own" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Milestones
CREATE POLICY "milestones_select_all" ON public.milestones FOR SELECT TO public USING (true);

-- Payment Methods
CREATE POLICY "payment_methods_select_all" ON public.payment_methods FOR SELECT TO public USING (true);
CREATE POLICY "payment_methods_manage_own" ON public.payment_methods FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Test - this should work WITHOUT being logged in:
SELECT 'Test: Profiles count (should work without auth)' as test, COUNT(*) as count FROM profiles;
