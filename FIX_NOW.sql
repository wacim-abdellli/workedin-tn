-- ============================================
-- FIX NOW - Restore your app immediately
-- ============================================

-- Step 1: Make you admin
UPDATE public.profiles SET is_admin = true WHERE email = 'wacimabdelli01@gmail.com';

-- Step 2: Drop all existing policies
DO $$ 
DECLARE pol record;
BEGIN
    FOR pol IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Step 3: PROFILES
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON public.profiles FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Step 4: FREELANCER_PROFILES
CREATE POLICY "freelancer_profiles_select_all" ON public.freelancer_profiles FOR SELECT USING (true);
CREATE POLICY "freelancer_profiles_insert_own" ON public.freelancer_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "freelancer_profiles_update_own" ON public.freelancer_profiles FOR UPDATE USING (auth.uid() = id);

-- Step 5: JOBS
CREATE POLICY "jobs_select_all" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "jobs_insert_own" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "jobs_update_own" ON public.jobs FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "jobs_delete_own" ON public.jobs FOR DELETE USING (auth.uid() = client_id);
CREATE POLICY "jobs_admin" ON public.jobs FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Step 6: PROPOSALS
CREATE POLICY "proposals_select_involved" ON public.proposals FOR SELECT USING (auth.uid() = freelancer_id OR auth.uid() IN (SELECT client_id FROM jobs WHERE id = job_id));
CREATE POLICY "proposals_insert_own" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
CREATE POLICY "proposals_update_own" ON public.proposals FOR UPDATE USING (auth.uid() = freelancer_id);
CREATE POLICY "proposals_admin" ON public.proposals FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Step 7: CONTRACTS
CREATE POLICY "contracts_select_involved" ON public.contracts FOR SELECT USING (auth.uid() = client_id OR auth.uid() = freelancer_id);
CREATE POLICY "contracts_insert_involved" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = freelancer_id);
CREATE POLICY "contracts_update_involved" ON public.contracts FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = freelancer_id);
CREATE POLICY "contracts_admin" ON public.contracts FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Step 8: MESSAGES
CREATE POLICY "messages_select_involved" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Step 9: NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Step 10: WALLETS
CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_update_own" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wallets_admin" ON public.wallets FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Step 11: TRANSACTIONS
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Step 12: PORTFOLIO_ITEMS
CREATE POLICY "portfolio_select_all" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "portfolio_insert_own" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
CREATE POLICY "portfolio_update_own" ON public.portfolio_items FOR UPDATE USING (auth.uid() = freelancer_id);
CREATE POLICY "portfolio_delete_own" ON public.portfolio_items FOR DELETE USING (auth.uid() = freelancer_id);

-- Step 13: REVIEWS
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_involved" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Step 14: IDENTITY_VERIFICATIONS
CREATE POLICY "verifications_select_own" ON public.identity_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "verifications_insert_own" ON public.identity_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verifications_admin" ON public.identity_verifications FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Step 15: DISPUTES
CREATE POLICY "disputes_select_involved" ON public.disputes FOR SELECT USING (auth.uid() = opened_by);
CREATE POLICY "disputes_insert_own" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = opened_by);
CREATE POLICY "disputes_admin" ON public.disputes FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Done!
SELECT 'App restored!' as status, email, is_admin FROM public.profiles WHERE email = 'wacimabdelli01@gmail.com';
