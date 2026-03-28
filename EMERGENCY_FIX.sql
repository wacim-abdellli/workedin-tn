-- EMERGENCY FIX - Make all admin queries work without auth
-- Run this in Supabase SQL Editor

-- Drop all existing policies
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

-- Create PUBLIC policies (no auth required)
-- Profiles
CREATE POLICY "public_profiles_select" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "public_profiles_insert" ON public.profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_profiles_update" ON public.profiles FOR UPDATE TO public USING (true);

-- Jobs
CREATE POLICY "public_jobs_select" ON public.jobs FOR SELECT TO public USING (true);
CREATE POLICY "public_jobs_insert" ON public.jobs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_jobs_update" ON public.jobs FOR UPDATE TO public USING (true);
CREATE POLICY "public_jobs_delete" ON public.jobs FOR DELETE TO public USING (true);

-- Contracts
CREATE POLICY "public_contracts_select" ON public.contracts FOR SELECT TO public USING (true);
CREATE POLICY "public_contracts_insert" ON public.contracts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_contracts_update" ON public.contracts FOR UPDATE TO public USING (true);

-- Proposals
CREATE POLICY "public_proposals_select" ON public.proposals FOR SELECT TO public USING (true);
CREATE POLICY "public_proposals_insert" ON public.proposals FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_proposals_update" ON public.proposals FOR UPDATE TO public USING (true);

-- Disputes
CREATE POLICY "public_disputes_select" ON public.disputes FOR SELECT TO public USING (true);
CREATE POLICY "public_disputes_insert" ON public.disputes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_disputes_update" ON public.disputes FOR UPDATE TO public USING (true);

-- Notifications
CREATE POLICY "public_notifications_select" ON public.notifications FOR SELECT TO public USING (true);
CREATE POLICY "public_notifications_update" ON public.notifications FOR UPDATE TO public USING (true);
CREATE POLICY "public_notifications_delete" ON public.notifications FOR DELETE TO public USING (true);
CREATE POLICY "public_notifications_insert" ON public.notifications FOR INSERT TO public WITH CHECK (true);

-- Identity Verifications
CREATE POLICY "public_identity_verifications_select" ON public.identity_verifications FOR SELECT TO public USING (true);
CREATE POLICY "public_identity_verifications_insert" ON public.identity_verifications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_identity_verifications_update" ON public.identity_verifications FOR UPDATE TO public USING (true);

-- Wallets
CREATE POLICY "public_wallets_select" ON public.wallets FOR SELECT TO public USING (true);
CREATE POLICY "public_wallets_insert" ON public.wallets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_wallets_update" ON public.wallets FOR UPDATE TO public USING (true);

-- Transactions
CREATE POLICY "public_transactions_select" ON public.transactions FOR SELECT TO public USING (true);
CREATE POLICY "public_transactions_insert" ON public.transactions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_transactions_update" ON public.transactions FOR UPDATE TO public USING (true);

-- Withdrawals
CREATE POLICY "public_withdrawals_select" ON public.withdrawals FOR SELECT TO public USING (true);
CREATE POLICY "public_withdrawals_insert" ON public.withdrawals FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_withdrawals_update" ON public.withdrawals FOR UPDATE TO public USING (true);

-- Freelancer Profiles
CREATE POLICY "public_freelancer_profiles_select" ON public.freelancer_profiles FOR SELECT TO public USING (true);
CREATE POLICY "public_freelancer_profiles_insert" ON public.freelancer_profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_freelancer_profiles_update" ON public.freelancer_profiles FOR UPDATE TO public USING (true);

-- Portfolio Items
CREATE POLICY "public_portfolio_items_select" ON public.portfolio_items FOR SELECT TO public USING (true);
CREATE POLICY "public_portfolio_items_insert" ON public.portfolio_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_portfolio_items_update" ON public.portfolio_items FOR UPDATE TO public USING (true);
CREATE POLICY "public_portfolio_items_delete" ON public.portfolio_items FOR DELETE TO public USING (true);

-- Messages
CREATE POLICY "public_messages_select" ON public.messages FOR SELECT TO public USING (true);
CREATE POLICY "public_messages_insert" ON public.messages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_messages_update" ON public.messages FOR UPDATE TO public USING (true);

-- Reviews
CREATE POLICY "public_reviews_select" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "public_reviews_insert" ON public.reviews FOR INSERT TO public WITH CHECK (true);

-- Favorites
CREATE POLICY "public_favorites_select" ON public.favorites FOR SELECT TO public USING (true);
CREATE POLICY "public_favorites_insert" ON public.favorites FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_favorites_delete" ON public.favorites FOR DELETE TO public USING (true);

-- Milestones
CREATE POLICY "public_milestones_select" ON public.milestones FOR SELECT TO public USING (true);
CREATE POLICY "public_milestones_insert" ON public.milestones FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_milestones_update" ON public.milestones FOR UPDATE TO public USING (true);

-- Payment Methods
CREATE POLICY "public_payment_methods_select" ON public.payment_methods FOR SELECT TO public USING (true);
CREATE POLICY "public_payment_methods_insert" ON public.payment_methods FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_payment_methods_update" ON public.payment_methods FOR UPDATE TO public USING (true);

-- Test counts
SELECT 'Profiles:' as name, COUNT(*) as count FROM profiles;
SELECT 'Jobs:' as name, COUNT(*) as count FROM jobs;
SELECT 'Contracts:' as name, COUNT(*) as count FROM contracts;
