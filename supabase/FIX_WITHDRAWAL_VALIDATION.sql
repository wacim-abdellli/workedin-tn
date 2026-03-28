-- =====================================================
-- WITHDRAWAL VALIDATION FIX
-- Run this in Supabase SQL Editor to enforce MIN_WITHDRAWAL_AMOUNT server-side
-- =====================================================

-- Drop existing insert policy if exists
DROP POLICY IF EXISTS "withdrawals_insert_own" ON withdrawals;

-- Create secure insert policy with amount validation
-- This prevents users from inserting withdrawals below the minimum (10 TND)
CREATE POLICY "withdrawals_insert_own" ON withdrawals FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND amount >= 10 
        AND status = 'pending'
    );

-- Also ensure SELECT only returns own withdrawals
DROP POLICY IF EXISTS "withdrawals_select_own" ON withdrawals;
CREATE POLICY "withdrawals_select_own" ON withdrawals FOR SELECT
    USING (user_id = auth.uid());

-- Admin can see all
DROP POLICY IF EXISTS "admin_select_all_withdrawals" ON withdrawals;
CREATE POLICY "admin_select_all_withdrawals" ON withdrawals FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
