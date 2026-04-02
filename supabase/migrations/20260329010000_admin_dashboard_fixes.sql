-- =========================================================================
-- ADMIN DASHBOARD & RLS FIXES
-- This script grants full SELECT/UPDATE/DELETE access to admins.
-- Without this, the Admin Dashboard queries fail and return 0 results.
-- =========================================================================

-- 1. PROFILES
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
CREATE POLICY "admin_all_profiles"
ON profiles FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 2. JOBS
DROP POLICY IF EXISTS "admin_all_jobs" ON jobs;
CREATE POLICY "admin_all_jobs"
ON jobs FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 3. PROPOSALS
DROP POLICY IF EXISTS "admin_all_proposals" ON proposals;
CREATE POLICY "admin_all_proposals"
ON proposals FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 4. CONTRACTS
DROP POLICY IF EXISTS "admin_all_contracts" ON contracts;
CREATE POLICY "admin_all_contracts"
ON contracts FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 5. IDENTITY VERIFICATIONS
DROP POLICY IF EXISTS "admin_all_identity_verifications" ON identity_verifications;
CREATE POLICY "admin_all_identity_verifications"
ON identity_verifications FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 6. WALLETS (For viewing balances in admin panel later)
DROP POLICY IF EXISTS "admin_all_wallets" ON wallets;
CREATE POLICY "admin_all_wallets"
ON wallets FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Note: disputes already has "disputes_select_admin" and "disputes_update_admin" 
-- from migration 20260328_disputes_system.sql
