-- =====================================================
-- GRANT ADMIN ACCESS
-- Run this in Supabase SQL Editor (prod + dev)
-- Replace the email below with your actual admin email
-- =====================================================

UPDATE public.profiles
SET is_admin = true
WHERE email = 'wacimabdelli01@gmail.com';

-- Verify it worked
SELECT id, email, is_admin FROM public.profiles WHERE is_admin = true;
