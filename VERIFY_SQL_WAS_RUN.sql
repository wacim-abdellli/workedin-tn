-- ============================================================
-- VERIFY THE SQL FIX WAS APPLIED CORRECTLY
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Check if is_admin() function exists
SELECT 
  'Step 1: is_admin() function' as check_step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run FIX_ADMIN_RLS.sql!'
  END as status;

-- 2. Check if you're logged in
SELECT 
  'Step 2: Your session' as check_step,
  CASE 
    WHEN auth.uid() IS NOT NULL 
    THEN '✅ Logged in as ' || COALESCE(auth.email(), 'unknown')
    ELSE '❌ NOT LOGGED IN'
  END as status;

-- 3. Check your is_admin status in database
SELECT 
  'Step 3: Your is_admin in DB' as check_step,
  CASE 
    WHEN is_admin = true THEN '✅ TRUE'
    WHEN is_admin = false THEN '❌ FALSE - Need to set to true!'
    ELSE '❌ NULL - Need to set to true!'
  END as status,
  email,
  full_name
FROM profiles 
WHERE id = auth.uid();

-- 4. Test is_admin() function
SELECT 
  'Step 4: is_admin() result' as check_step,
  CASE 
    WHEN is_admin() = true THEN '✅ Returns TRUE'
    ELSE '❌ Returns FALSE'
  END as status;

-- 5. Check RLS policies
SELECT 
  'Step 5: RLS policies' as check_step,
  COUNT(*)::text || ' policies found' as status
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Try to count profiles (tests if RLS allows it)
SELECT 
  'Step 6: Can read profiles?' as check_step,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Can read ' || COUNT(*)::text || ' profiles'
    ELSE '❌ No profiles visible'
  END as status
FROM profiles;

-- ============================================================
-- IF STEP 3 SHOWS FALSE OR NULL, RUN THIS:
-- ============================================================

-- UPDATE profiles SET is_admin = true WHERE id = auth.uid();

-- Then re-run the checks above
