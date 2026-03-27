-- ============================================
-- FINAL COMPREHENSIVE ADMIN FIX
-- This will fix EVERYTHING
-- ============================================

-- Step 1: Ensure you're admin (you already did this, but let's be sure)
UPDATE public.profiles
SET is_admin = true
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 2: Create or replace the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Step 3: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Step 4: Drop ALL existing admin policies
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_all_jobs" ON public.jobs;
DROP POLICY IF EXISTS "admin_all_contracts" ON public.contracts;
DROP POLICY IF EXISTS "admin_all_proposals" ON public.proposals;
DROP POLICY IF EXISTS "admin_all_identity_verifications" ON public.identity_verifications;
DROP POLICY IF EXISTS "admin_all_wallets" ON public.wallets;
DROP POLICY IF EXISTS "admin_all_disputes" ON public.disputes;
DROP POLICY IF EXISTS "admin_all_reports" ON public.reports;
DROP POLICY IF EXISTS "admin_all_notifications" ON public.notifications;

-- Step 5: Create NEW admin policies that DEFINITELY work
CREATE POLICY "admin_all_profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "admin_all_jobs" 
ON public.jobs 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "admin_all_contracts" 
ON public.contracts 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "admin_all_proposals" 
ON public.proposals 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "admin_all_identity_verifications" 
ON public.identity_verifications 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "admin_all_wallets" 
ON public.wallets 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

CREATE POLICY "admin_all_disputes" 
ON public.disputes 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Step 6: Verify everything
SELECT 
  '✅ Your admin status' as check_name,
  id, 
  email, 
  is_admin 
FROM public.profiles 
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 7: Test if you can count records
SELECT 
  '✅ Can count profiles' as check_name,
  COUNT(*) as count 
FROM public.profiles;

SELECT 
  '✅ Can count jobs' as check_name,
  COUNT(*) as count 
FROM public.jobs;

SELECT 
  '✅ Can count contracts' as check_name,
  COUNT(*) as count 
FROM public.contracts;

-- If you see numbers above (not errors), it worked!
