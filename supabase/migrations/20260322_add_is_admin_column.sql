-- Add DB-backed admin flag for profiles-based authorization
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
ON profiles(is_admin)
WHERE is_admin = true;

UPDATE profiles
SET is_admin = true
WHERE email IN ('wacimabdelli01@gmail.com');
