-- Migration to add username column
-- Run this in your Supabase SQL Editor

-- 1. Add username column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 3. Generate usernames for existing users
-- Takes alphanumeric chars from full_name, lowers case, adds random suffix or part of ID to ensure uniqueness
-- Note: This is a simple migration. For production with collisions, more robust logic is needed.
UPDATE profiles 
SET username = LOWER(REGEXP_REPLACE(full_name, '[^a-zA-Z0-9]', '', 'g')) || '_' || SUBSTRING(id::text, 1, 6)
WHERE username IS NULL;

-- 4. Add constraint to ensure future usernames are valid format (optional but good)
-- ALTER TABLE profiles ADD CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_]+$');
