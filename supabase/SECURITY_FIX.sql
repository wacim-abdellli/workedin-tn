-- =====================================================
-- URGENT RLS SECURITY FIX
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. DROP ALL EXISTING PUBLIC SELECT POLICIES
-- These are SECURITY RISKS - they expose private data!

-- Contracts
DROP POLICY IF EXISTS "contracts_select_all" ON contracts;

-- Disputes  
DROP POLICY IF EXISTS "disputes_select_all" ON disputes;

-- Favorites
DROP POLICY IF EXISTS "favorites_select_all" ON favorites;

-- Freelancer Profiles
DROP POLICY IF EXISTS "freelancer_profiles_select_all" ON freelancer_profiles;

-- Identity Verifications (SENSITIVE!)
DROP POLICY IF EXISTS "identity_verifications_select_all" ON identity_verifications;

-- Jobs (keep public for job board, but restrict)
DROP POLICY IF EXISTS "jobs_select_all" ON jobs;

-- Messages (SENSITIVE!)
DROP POLICY IF EXISTS "messages_select_all" ON messages;

-- Milestones
DROP POLICY IF EXISTS "milestones_select_all" ON milestones;

-- Notifications (SENSITIVE!)
DROP POLICY IF EXISTS "notifications_select_all" ON notifications;

-- Payment Methods (SENSITIVE!)
DROP POLICY IF EXISTS "payment_methods_select_all" ON payment_methods;

-- Portfolio Items (keep public - this is intentional marketing)
-- DROP POLICY IF EXISTS "portfolio_items_select_all" ON portfolio_items;

-- Profiles (SENSITIVE!)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;

-- Proposals
DROP POLICY IF EXISTS "proposals_select_all" ON proposals;

-- Reviews (keep public - this is intentional)
-- DROP POLICY IF EXISTS "reviews_select_all" ON reviews;

-- Transactions (SENSITIVE!)
DROP POLICY IF EXISTS "transactions_select_all" ON transactions;

-- Wallets (SENSITIVE!)
DROP POLICY IF EXISTS "wallets_select_all" ON wallets;

-- Withdrawals (SENSITIVE!)
DROP POLICY IF EXISTS "withdrawals_select_all" ON withdrawals;


-- =====================================================
-- 2. CREATE SECURE POLICIES
-- =====================================================

-- JOBS: Public can see open jobs, owners see their own, admins see all
CREATE POLICY "jobs_select_public" ON jobs FOR SELECT
    USING (status = 'open' AND visibility = 'public');

CREATE POLICY "jobs_select_own" ON jobs FOR SELECT
    USING (client_id = auth.uid());

-- PROPOSALS: Job owner and freelancer can see
CREATE POLICY "proposals_select_freelancer" ON proposals FOR SELECT
    USING (freelancer_id = auth.uid());

CREATE POLICY "proposals_select_client" ON jobs FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM proposals WHERE job_id = jobs.id AND proposals.freelancer_id = auth.uid())
        OR jobs.client_id = auth.uid()
    );

-- CONTRACTS: Only involved parties
CREATE POLICY "contracts_select_parties" ON contracts FOR SELECT
    USING (freelancer_id = auth.uid() OR client_id = auth.uid());

-- PROFILES: Users see own, public see limited (name, avatar only)
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "profiles_select_public" ON profiles FOR SELECT
    USING (true);

-- WALLETS: Only owner and admin
CREATE POLICY "wallets_select_own" ON wallets FOR SELECT
    USING (user_id = auth.uid());

-- TRANSACTIONS: Only owner and admin
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT
    USING (user_id = auth.uid());

-- NOTIFICATIONS: Only owner
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- MESSAGES: Only sender or receiver
CREATE POLICY "messages_select_parties" ON messages FOR SELECT
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- PAYMENT METHODS: Only owner
CREATE POLICY "payment_methods_select_own" ON payment_methods FOR SELECT
    USING (user_id = auth.uid());

-- IDENTITY VERIFICATIONS: Only owner and admin
CREATE POLICY "identity_verifications_select_own" ON identity_verifications FOR SELECT
    USING (user_id = auth.uid());

-- WITHDRAWALS: Only owner and admin
CREATE POLICY "withdrawals_select_own" ON withdrawals FOR SELECT
    USING (user_id = auth.uid());

-- DISPUTES: Only involved parties and admin (via contract)
CREATE POLICY "disputes_select_parties" ON disputes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM contracts c
            WHERE c.id = disputes.contract_id
            AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
        )
    );

-- =====================================================
-- 3. ADMIN POLICIES (for admin dashboard)
-- =====================================================

-- Admin can SELECT everything
CREATE POLICY "admin_select_all_profiles" ON profiles FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_select_all_jobs" ON jobs FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_select_all_proposals" ON proposals FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_select_all_contracts" ON contracts FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_select_all_wallets" ON wallets FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_select_all_transactions" ON transactions FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_select_all_identity_verifications" ON identity_verifications FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_select_all_disputes" ON disputes FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_select_all_notifications" ON notifications FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_select_all_withdrawals" ON withdrawals FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
