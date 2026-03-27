-- ============================================================
-- FAST RLS FIX: Remove slow function, use direct JWT check
-- ============================================================

-- Step 1: Drop the slow is_admin() function
DROP FUNCTION IF EXISTS is_admin();

-- Step 2: Drop all existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- Step 3: Create FAST policies using JWT claims directly
-- This checks the JWT token metadata instead of querying the database

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

-- Step 4: Apply same fast approach to other tables

-- Jobs table
DROP POLICY IF EXISTS "jobs_select" ON jobs;
CREATE POLICY "jobs_select_fast"
ON jobs FOR SELECT
USING (
  auth.uid() = client_id
  OR (auth.jwt() ->> 'is_admin')::boolean = true
  OR status = 'open'
);

DROP POLICY IF EXISTS "jobs_delete" ON jobs;
CREATE POLICY "jobs_delete_fast"
ON jobs FOR DELETE
USING (
  auth.uid() = client_id
  OR (auth.jwt() ->> 'is_admin')::boolean = true
);

-- Identity verifications table
DROP POLICY IF EXISTS "identity_verifications_select" ON identity_verifications;
CREATE POLICY "identity_verifications_select_fast"
ON identity_verifications FOR SELECT
USING (
  auth.uid() = user_id
  OR (auth.jwt() ->> 'is_admin')::boolean = true
);

DROP POLICY IF EXISTS "identity_verifications_update" ON identity_verifications;
CREATE POLICY "identity_verifications_update_fast"
ON identity_verifications FOR UPDATE
USING (
  auth.uid() = user_id
  OR (auth.jwt() ->> 'is_admin')::boolean = true
);

-- Disputes table
DROP POLICY IF EXISTS "disputes_select" ON disputes;
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

-- Contracts table
DROP POLICY IF EXISTS "contracts_select" ON contracts;
CREATE POLICY "contracts_select_fast"
ON contracts FOR SELECT
USING (
  auth.uid() IN (client_id, freelancer_id)
  OR (auth.jwt() ->> 'is_admin')::boolean = true
);

-- Step 5: Verify the JWT has is_admin
SELECT 
    email,
    raw_app_meta_data->>'is_admin' as jwt_is_admin
FROM auth.users 
WHERE email = 'wacimabdelli01@gmail.com';

-- This should show jwt_is_admin = 'true'