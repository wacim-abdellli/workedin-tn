-- Run this in Supabase SQL Editor to check your admin status

-- 1. Check if you have any admin users
SELECT id, email, full_name, is_admin, created_at
FROM public.profiles
WHERE is_admin = true;

-- 2. Check if the is_admin() function works
SELECT public.is_admin() as am_i_admin;

-- 3. Check your current user
SELECT auth.uid() as my_user_id;

-- 4. Check if your email is set as admin
SELECT id, email, is_admin
FROM public.profiles
WHERE email = 'wacimabdelli01@gmail.com';

-- If you need to make yourself admin, run this:
-- UPDATE public.profiles
-- SET is_admin = true
-- WHERE email = 'wacimabdelli01@gmail.com';
