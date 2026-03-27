-- ============================================
-- MAKE YOURSELF ADMIN - Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Make your user an admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'wacimabdelli01@gmail.com';

-- Step 2: Verify it worked
SELECT 
    id, 
    email, 
    full_name,
    is_admin,
    'SUCCESS! You are now an admin' as message
FROM public.profiles 
WHERE email = 'wacimabdelli01@gmail.com';

-- If you see is_admin = true above, you're done!
-- Now log out and log back in to your app.
