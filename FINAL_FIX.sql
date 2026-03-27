-- ============================================================
-- FINAL FIX: Update user metadata in auth.users
-- ============================================================

-- The issue is that is_admin is in profiles table,
-- but Supabase auth also needs it in the JWT token metadata

-- Step 1: Update the profiles table (already done)
UPDATE profiles 
SET is_admin = true 
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 2: Update auth.users metadata so JWT includes is_admin
-- This is the KEY step that was missing!
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 3: Verify both are set
SELECT 
    u.email,
    u.raw_app_meta_data->>'is_admin' as jwt_is_admin,
    p.is_admin as db_is_admin
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'wacimabdelli01@gmail.com';

-- You should see both jwt_is_admin and db_is_admin as 'true'
