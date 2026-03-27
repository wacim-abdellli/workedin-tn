-- ============================================================
-- DEFINITIVE FIX: Admin RLS without recursion
-- Run this entire block in Supabase SQL Editor
-- ============================================================

-- Step 1: Create a SECURITY DEFINER function that bypasses RLS
-- This checks is_admin without triggering the RLS policy itself
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

-- Step 2: Drop ALL existing policies on profiles
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

-- Step 3: Recreate clean policies using the function (no recursion)
CREATE POLICY "profiles_select"
ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR is_admin()
);

CREATE POLICY "profiles_update"
ON profiles FOR UPDATE
USING (
  auth.uid() = id
  OR is_admin()
);

CREATE POLICY "profiles_delete"
ON profiles FOR DELETE
USING (is_admin());

CREATE POLICY "profiles_insert"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 4: Make sure your account is admin (run as postgres role)
UPDATE profiles 
SET is_admin = true 
WHERE id = auth.uid();

-- Step 5: Verify it worked
SELECT id, email, full_name, is_admin 
FROM profiles 
WHERE id = auth.uid();


-- ============================================================
-- Fix RLS for disputes table (admin access)
-- ============================================================

-- Allow admin to read all disputes
DROP POLICY IF EXISTS "disputes_select" ON disputes;
CREATE POLICY "disputes_select"
ON disputes FOR SELECT
USING (
  is_admin()
  OR
  auth.uid() = opened_by
  OR
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id
    AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
  )
);

-- Allow admin to update disputes (resolve them)
DROP POLICY IF EXISTS "disputes_update" ON disputes;
CREATE POLICY "disputes_update"
ON disputes FOR UPDATE
USING (is_admin());

-- ============================================================
-- Fix RLS for contracts table (admin access for joins)
-- ============================================================

DROP POLICY IF EXISTS "contracts_select" ON contracts;
CREATE POLICY "contracts_select"
ON contracts FOR SELECT
USING (
  auth.uid() IN (client_id, freelancer_id)
  OR is_admin()
);

-- ============================================================
-- Fix RLS for jobs table (admin access for joins)
-- ============================================================

DROP POLICY IF EXISTS "jobs_select" ON jobs;
CREATE POLICY "jobs_select"
ON jobs FOR SELECT
USING (
  auth.uid() = client_id
  OR is_admin()
  OR status = 'open'  -- Public jobs are visible to everyone
);

DROP POLICY IF EXISTS "jobs_update" ON jobs;
CREATE POLICY "jobs_update"
ON jobs FOR UPDATE
USING (
  auth.uid() = client_id
  OR is_admin()
);

DROP POLICY IF EXISTS "jobs_delete" ON jobs;
CREATE POLICY "jobs_delete"
ON jobs FOR DELETE
USING (
  auth.uid() = client_id
  OR is_admin()
);

-- ============================================================
-- Fix RLS for identity_verifications table (admin access)
-- ============================================================

DROP POLICY IF EXISTS "identity_verifications_select" ON identity_verifications;
CREATE POLICY "identity_verifications_select"
ON identity_verifications FOR SELECT
USING (
  auth.uid() = user_id
  OR is_admin()
);

DROP POLICY IF EXISTS "identity_verifications_update" ON identity_verifications;
CREATE POLICY "identity_verifications_update"
ON identity_verifications FOR UPDATE
USING (
  auth.uid() = user_id
  OR is_admin()
);

DROP POLICY IF EXISTS "identity_verifications_delete" ON identity_verifications;
CREATE POLICY "identity_verifications_delete"
ON identity_verifications FOR DELETE
USING (is_admin());

-- ============================================================
-- Verify everything works
-- ============================================================

-- Check if you're admin
SELECT 'Your admin status:' as info, is_admin, email, full_name 
FROM profiles 
WHERE id = auth.uid();

-- Test queries
SELECT 'Profiles count:' as info, COUNT(*) as count FROM profiles;
SELECT 'Jobs count:' as info, COUNT(*) as count FROM jobs;
SELECT 'Disputes count:' as info, COUNT(*) as count FROM disputes;
SELECT 'Verifications count:' as info, COUNT(*) as count FROM identity_verifications;
