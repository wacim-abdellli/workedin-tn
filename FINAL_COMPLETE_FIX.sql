-- ============================================================
-- FINAL COMPLETE FIX
-- Drop and recreate ALL policies with the is_admin() function
-- ============================================================

-- The function already exists, just verify it
SELECT 'Function exists:' as check, COUNT(*) as count 
FROM pg_proc WHERE proname = 'is_admin';

-- Drop ALL policies on all tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Recreate profiles policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT
USING (auth.uid() = id OR is_admin());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
USING (auth.uid() = id OR is_admin());

CREATE POLICY "profiles_delete" ON profiles FOR DELETE
USING (is_admin());

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Recreate jobs policies
CREATE POLICY "jobs_select" ON jobs FOR SELECT
USING (auth.uid() = client_id OR is_admin() OR status = 'open');

CREATE POLICY "jobs_update" ON jobs FOR UPDATE
USING (auth.uid() = client_id OR is_admin());

CREATE POLICY "jobs_delete" ON jobs FOR DELETE
USING (auth.uid() = client_id OR is_admin());

CREATE POLICY "jobs_insert" ON jobs FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Recreate contracts policies
CREATE POLICY "contracts_select" ON contracts FOR SELECT
USING (auth.uid() IN (client_id, freelancer_id) OR is_admin());

-- Recreate identity_verifications policies
CREATE POLICY "identity_verifications_select" ON identity_verifications FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "identity_verifications_update" ON identity_verifications FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "identity_verifications_delete" ON identity_verifications FOR DELETE
USING (is_admin());

-- Recreate disputes policies
CREATE POLICY "disputes_select" ON disputes FOR SELECT
USING (
  is_admin()
  OR auth.uid() = opened_by
  OR EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id
    AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
  )
);

CREATE POLICY "disputes_update" ON disputes FOR UPDATE
USING (is_admin());

-- Verify
SELECT 'Setup complete!' as status;
SELECT 'Profiles visible:' as test, COUNT(*) FROM profiles;
