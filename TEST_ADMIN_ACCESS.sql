-- Run this to diagnose the issue

-- 1. Check if you're logged in
SELECT 
    'Current user ID' as test,
    auth.uid() as user_id;

-- 2. Check your profile
SELECT 
    'Your profile' as test,
    id, 
    email, 
    full_name,
    is_admin,
    user_type
FROM public.profiles 
WHERE id = auth.uid();

-- 3. Test the is_admin function
SELECT 
    'is_admin() function' as test,
    public.is_admin() as result;

-- 4. Try to count profiles (should work if admin)
SELECT 
    'Can you count profiles?' as test,
    COUNT(*) as count
FROM public.profiles;

-- 5. Check all admin users
SELECT 
    'All admin users' as test,
    id,
    email,
    is_admin
FROM public.profiles
WHERE is_admin = true;
