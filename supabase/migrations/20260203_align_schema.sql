-- ============================================
-- Khedma.tn Database Alignment Migration
-- Phase 1: Add Missing Columns
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- FIX 1.1: PROFILES TABLE - Missing Columns
-- ============================================

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cin_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cin_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_cin_verified ON profiles(cin_verified);

-- Update existing users: if they have a user_type, assume onboarding is complete
UPDATE profiles 
SET onboarding_completed = true 
WHERE user_type IS NOT NULL 
  AND onboarding_completed = false;

-- ============================================
-- FIX 1.2: FREELANCER_PROFILES - Missing Columns
-- ============================================

-- Add statistics columns to freelancer_profiles
-- Note: response_time_hours may already exist, using IF NOT EXISTS
ALTER TABLE freelancer_profiles
ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS repeat_clients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_contracts INTEGER DEFAULT 0;

-- Add indexes for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_freelancer_completion_rate ON freelancer_profiles(completion_rate);
CREATE INDEX IF NOT EXISTS idx_freelancer_repeat_clients ON freelancer_profiles(repeat_clients);

-- ============================================
-- FIX 1.3: JOBS TABLE - Missing Columns
-- ============================================

-- Add payment-related fields to jobs
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TND';

-- Note: payment_method enum already exists in schema (payment_method_enum)
-- But jobs table uses job_type for hourly/fixed distinction
-- The TypeScript type uses payment_method differently, so we align here

-- ============================================
-- VERIFICATION QUERIES (Run these after the above)
-- ============================================

-- Verify profiles columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('onboarding_completed', 'cin_verified', 'cin_submitted', 'username')
ORDER BY column_name;

-- Verify freelancer_profiles columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
  AND column_name IN ('completion_rate', 'repeat_clients', 'response_time_hours', 'active_contracts')
ORDER BY column_name;

-- Verify jobs columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
  AND column_name IN ('currency')
ORDER BY column_name;

-- Verify indexes created
SELECT indexname, tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    indexname LIKE 'idx_profiles_%' 
    OR indexname LIKE 'idx_freelancer_completion%'
    OR indexname LIKE 'idx_freelancer_repeat%'
  )
ORDER BY tablename, indexname;
