-- Check admin status for ALL users
SELECT 
    id,
    email,
    full_name,
    is_admin,
    CASE WHEN is_admin = true THEN '✅ ADMIN' ELSE '❌ NOT ADMIN' END as status
FROM public.profiles;

-- Check if there's a user with the exact email
SELECT * FROM public.profiles WHERE email = 'wacimabdelli01@gmail.com';

-- Test is_admin() function manually (replace USER_ID with your actual auth.uid)
-- First get your user ID:
SELECT auth.uid() as your_user_id;
