-- Run this in Supabase SQL Editor
-- This bypasses RLS entirely using postgres role

-- First, disable RLS temporarily to do the update
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Set your account as admin (using the exact email you log in with)
UPDATE profiles 
SET is_admin = true 
WHERE email = 'wacimabdelli01@gmail.com';

-- Also make sure the other account stays admin
UPDATE profiles 
SET is_admin = true 
WHERE email LIKE '%wacimabdelli%';

-- Verify
SELECT id, email, full_name, is_admin FROM profiles WHERE is_admin = true;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
