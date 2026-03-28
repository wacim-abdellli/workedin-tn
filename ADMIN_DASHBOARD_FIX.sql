-- Admin Dashboard Fix - Run this in Supabase SQL Editor

-- Step 1: Ensure admin function exists
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Step 2: Fix jobs SELECT policy for admin
DROP POLICY IF EXISTS "jobs_select_all" ON jobs;
CREATE POLICY "jobs_select_all"
ON public.jobs FOR SELECT 
TO authenticated
USING (true);

-- Step 3: Fix contracts SELECT policy for admin
DROP POLICY IF EXISTS "contracts_select_involved" ON contracts;
CREATE POLICY "contracts_select_involved"
ON public.contracts FOR SELECT 
TO authenticated
USING (client_id = auth.uid() OR freelancer_id = auth.uid() OR is_admin());

-- Step 4: Fix notifications SELECT policy for admin
DROP POLICY IF EXISTS "Notifications are viewable by everyone" ON notifications;
CREATE POLICY "notifications_select"
ON public.notifications FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- Step 5: Verify admin status
SELECT 
  'Your admin status:' as info,
  id, 
  email, 
  is_admin,
  CASE 
    WHEN is_admin = true THEN '✅ You are admin'
    ELSE '❌ NOT ADMIN - Check if logged in'
  END as status
FROM public.profiles 
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 6: Test counts
SELECT 'Profiles count:' as test, COUNT(*) as count FROM public.profiles;
SELECT 'Jobs count:' as test, COUNT(*) as count FROM public.jobs;
SELECT 'Contracts count:' as test, COUNT(*) as count FROM public.contracts;
