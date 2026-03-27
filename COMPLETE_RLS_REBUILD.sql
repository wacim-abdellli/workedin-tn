-- ============================================================
-- COMPLETE RLS REBUILD: Drop all policies and function, rebuild with fast JWT checks
-- ============================================================

-- Step 1: Drop ALL policies that use is_admin() function
DROP POLICY IF EXISTS "admin_all_jobs" ON jobs;
DROP POLICY IF EXISTS "admin_all_contracts" ON contracts;
DROP POLICY IF EXISTS "admin_all_proposals" ON proposals;
DROP POLICY IF EXISTS "admin_all_identity_verifications" ON identity_verifications;
DROP POLICY IF EXISTS "admin_all_wallets" ON wallets;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "disputes_select" ON disputes;
DROP POLICY IF EXISTS "disputes_update" ON disputes;
DROP POLICY IF EXISTS "contracts_select" ON contracts;
DROP POLICY IF EXISTS "jobs_select" ON jobs;
DROP POLICY IF EXISTS "jobs_update" ON jobs;
DROP POLICY IF EXISTS "jobs_delete" ON jobs;
DROP POLICY IF EXISTS "identity_verifications_select" ON identity_verifications;
DROP POLICY IF EXISTS "identity_verifications_update" ON identity_verifications;
DROP POLICY IF EXISTS "identity_verifications_delete" ON identity_verifications;

-- Step 2: Now drop the function
DROP FUNCTION IF EXISTS is_admin();

-- Step 3: Create FAST policies using JWT claims directly

-- Profiles table
CREATE POLICY "profiles_select_fast"
ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR 
  (auth.jwt() ->> 'is_admin')::boolean = true
);

CREATE POLICY "profiles_update_fast"
ON profiles FOR UPDATE
USING (
  auth.uid() = id
  OR 
  (auth.jwt() ->> 'is_admin')::boolean = true
);

CREATE POLICY "profiles_delete_fast"
ON profiles FOR DELETE
USING ((auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "profiles_insert_fast"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Jobs table
CREATE POLICY "jobs_select_fast"
ON jobs FOR SELECT
USING (
  auth.uid() = client_id
  OR (auth.jwt() ->> 'is_admin')::boolean = true
  OR status = 'open'
);

CREATE POLICY "jobs_update_fast"
ON jobs FOR UPDATE
USING (
  auth.uid() = client_id
  OR (auth.jwt() ->> 'is_admin')::boolean = true
);

CREATE POLICY "jobs_delete_fast"
ON jobs FOR DELETE
USING (
  auth.uid() = client_id
  OR (auth.jwt() ->> 'is_admin')::boolean = true
);

-- Contracts table
CREATE POLICY "contracts_select_fast"
ON contracts FOR SELECT
USING (
  auth.uid() IN (client_id, freelancer_id)
  OR (auth.jwt() ->> 'is_admin')::boolean = true
);

-- Identity verifications table
CREATE POLICY "identity_verifications_select_fast"
ON identity_verifications FOR SELECT
USING (
  auth.uid() = user_id
  OR (auth.jwt() ->> 'is_admin')::boolean = true
);

CREATE POLICY "identity_verifications_update_fast"
ON identity_verifications FOR UPDATE
USING (
  auth.uid() = user_id
  OR (auth.jwt() ->> 'is_admin')::boolean = true
);

CREATE POLICY "identity_verifications_delete_fast"
ON identity_verifications FOR DELETE
USING ((auth.jwt() ->> 'is_admin')::boolean = true);

-- Disputes table
CREATE POLICY "disputes_select_fast"
ON disputes FOR SELECT
USING (
  (auth.jwt() ->> 'is_admin')::boolean = true
  OR
  auth.uid() = opened_by
  OR
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id
    AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
  )
);

CREATE POLICY "disputes_update_fast"
ON disputes FOR UPDATE
USING ((auth.jwt() ->> 'is_admin')::boolean = true);

-- Proposals table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proposals') THEN
    EXECUTE 'CREATE POLICY "proposals_select_fast" ON proposals FOR SELECT USING (auth.uid() = freelancer_id OR auth.uid() = (SELECT client_id FROM jobs WHERE id = job_id) OR (auth.jwt() ->> ''is_admin'')::boolean = true)';
  END IF;
END $$;

-- Wallets table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN
    EXECUTE 'CREATE POLICY "wallets_select_fast" ON wallets FOR SELECT USING (auth.uid() = user_id OR (auth.jwt() ->> ''is_admin'')::boolean = true)';
  END IF;
END $$;

-- Step 4: Verify JWT has is_admin
SELECT 
    'JWT check:' as info,
    email,
    raw_app_meta_data->>'is_admin' as jwt_is_admin
FROM auth.users 
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 5: Test query that should now be fast
SELECT 'Test query:' as info, COUNT(*) as profile_count FROM profiles;