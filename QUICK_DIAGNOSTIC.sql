-- Run this in Supabase SQL Editor
-- This will tell us exactly what's wrong

-- 1. Are you logged in?
SELECT 
  'Your email' as info,
  COALESCE(auth.email(), 'NOT LOGGED IN') as value;

-- 2. What's your user ID?
SELECT 
  'Your user ID' as info,
  COALESCE(auth.uid()::text, 'NOT LOGGED IN') as value;

-- 3. What's your is_admin status in the database?
SELECT 
  'Your is_admin in database' as info,
  COALESCE(is_admin::text, 'NULL') as value,
  email
FROM profiles 
WHERE id = auth.uid();

-- 4. Does is_admin() function exist?
SELECT 
  'is_admin() function exists' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
    THEN 'YES'
    ELSE 'NO - RUN FIX_ADMIN_RLS.sql!'
  END as value;

-- 5. What does is_admin() return?
SELECT 
  'is_admin() returns' as info,
  CASE 
    WHEN is_admin() THEN 'TRUE'
    ELSE 'FALSE'
  END as value;

-- 6. Can you see any profiles?
SELECT 
  'Profiles visible' as info,
  COUNT(*)::text as value
FROM profiles;

-- ============================================
-- IF "Your is_admin in database" shows FALSE or NULL, run this:
-- ============================================

-- UPDATE profiles SET is_admin = true WHERE id = auth.uid();

-- Then run the checks again
