-- ============================================================
-- ADMIN BYPASS: Create service role key policies
-- This bypasses JWT entirely and checks the database directly
-- ============================================================

-- Recreate the is_admin() function (we dropped it earlier)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

-- Now update ALL policies to use the function again
-- But this time with proper indexing to make it fast

-- First, create an index on profiles.is_admin for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(id, is_admin) WHERE is_admin = true;

-- Profiles
DROP POLICY IF EXISTS "profiles_select_fast" ON profiles;
CREATE POLICY "profiles_select_admin"
ON profiles FOR SELECT
USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "profiles_update_fast" ON profiles;
CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "profiles_delete_fast" ON profiles;
CREATE POLICY "profiles_delete_admin"
ON profiles FOR DELETE
USING (is_admin());

DROP POLICY IF EXISTS "profiles_insert_fast" ON profiles;
CREATE POLICY "profiles_insert_admin"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Jobs
DROP POLICY IF EXISTS "jobs_select_fast" ON jobs;
CREATE POLICY "jobs_select_admin"
ON jobs FOR SELECT
USING (auth.uid() = client_id OR is_admin() OR status = 'open');

DROP POLICY IF EXISTS "jobs_update_fast" ON jobs;
CREATE POLICY "jobs_update_admin"
ON jobs FOR UPDATE
USING (auth.uid() = client_id OR is_admin());

DROP POLICY IF EXISTS "jobs_delete_fast" ON jobs;
CREATE POLICY "jobs_delete_admin"
ON jobs FOR DELETE
USING (auth.uid() = client_id OR is_admin());

-- Contracts
DROP POLICY IF EXISTS "contracts_select_fast" ON contracts;
CREATE POLICY "contracts_select_admin"
ON contracts FOR SELECT
USING (auth.uid() IN (client_id, freelancer_id) OR is_admin());

-- Identity verifications
DROP POLICY IF EXISTS "identity_verifications_select_fast" ON identity_verifications;
CREATE POLICY "identity_verifications_select_admin"
ON identity_verifications FOR SELECT
USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "identity_verifications_update_fast" ON identity_verifications;
CREATE POLICY "identity_verifications_update_admin"
ON identity_verifications FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "identity_verifications_delete_fast" ON identity_verifications;
CREATE POLICY "identity_verifications_delete_admin"
ON identity_verifications FOR DELETE
USING (is_admin());

-- Disputes
DROP POLICY IF EXISTS "disputes_select_fast" ON disputes;
CREATE POLICY "disputes_select_admin"
ON disputes FOR SELECT
USING (
  is_admin()
  OR auth.uid() = opened_by
  OR EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id
    AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "disputes_update_fast" ON disputes;
CREATE POLICY "disputes_update_admin"
ON disputes FOR UPDATE
USING (is_admin());

-- Test it works
SELECT 
    'Test with your user ID:' as test,
    auth.uid() as your_uid,
    is_admin() as are_you_admin;

SELECT 'Profiles visible:' as test, COUNT(*) as count FROM profiles;
