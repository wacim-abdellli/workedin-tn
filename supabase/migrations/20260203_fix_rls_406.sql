-- ============================================
-- FIX: RLS Policies & Schema for 406 Errors
-- Date: 2026-02-03
-- Purpose: Add missing columns, tables, and fix RLS policies
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- SECTION 1: SCHEMA FIXES (Add missing columns/tables)
-- ============================================

-- Add currency column to jobs if missing
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TND';

-- Create job_skills join table if missing
-- Note: skill_id is TEXT to match the hardcoded PREDEFINED_SKILLS IDs ("1", "2", etc.)
CREATE TABLE IF NOT EXISTS job_skills (
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL,
    PRIMARY KEY (job_id, skill_id)
);

-- ============================================
-- SECTION 2: RLS ENABLEMENT
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 3: PROFILES RLS
-- ============================================

-- Add INSERT policy (CRITICAL for onboarding)
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure SELECT and UPDATE policies exist
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- SECTION 4: JOBS RLS
-- ============================================

-- Ensure clients can insert jobs
DROP POLICY IF EXISTS "jobs_insert" ON jobs;
CREATE POLICY "jobs_insert" ON jobs FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Ensure SELECT and UPDATE policies
DROP POLICY IF EXISTS "jobs_select" ON jobs;
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (visibility = 'public' OR client_id = auth.uid());

DROP POLICY IF EXISTS "jobs_update" ON jobs;
CREATE POLICY "jobs_update" ON jobs FOR UPDATE USING (auth.uid() = client_id);

-- ============================================
-- SECTION 5: JOB_SKILLS RLS
-- ============================================

-- Allow public to select job skills
DROP POLICY IF EXISTS "job_skills_select" ON job_skills;
CREATE POLICY "job_skills_select" ON job_skills FOR SELECT USING (true);

-- Allow clients to manage skills for their own jobs
DROP POLICY IF EXISTS "job_skills_manage" ON job_skills;
CREATE POLICY "job_skills_manage" ON job_skills FOR ALL 
USING (EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND client_id = auth.uid()));

-- ============================================
-- SECTION 6: FREELANCER_PROFILES RLS
-- ============================================

-- Ensure freelancer profiles are manageable
DROP POLICY IF EXISTS "freelancer_profiles_insert" ON freelancer_profiles;
CREATE POLICY "freelancer_profiles_insert" ON freelancer_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "freelancer_profiles_update" ON freelancer_profiles;
CREATE POLICY "freelancer_profiles_update" ON freelancer_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "freelancer_profiles_select" ON freelancer_profiles;
CREATE POLICY "freelancer_profiles_select" ON freelancer_profiles FOR SELECT USING (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'freelancer_profiles', 'jobs', 'job_skills')
ORDER BY tablename, cmd;

-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'currency';
