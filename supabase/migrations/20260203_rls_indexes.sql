-- ============================================
-- MIGRATION: RLS Policy Updates & Performance Indexes
-- Date: 2026-02-03
-- Purpose: Update RLS policies for new columns + add indexes
-- ============================================

-- ============================================
-- SECTION 1: RLS POLICY UPDATES
-- ============================================

-- 1.1 Profiles: Update policy for username uniqueness
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 1.2 Freelancer profiles: Ensure public read access includes new columns
DROP POLICY IF EXISTS "Freelancer profiles viewable by all" ON freelancer_profiles;

CREATE POLICY "Freelancer profiles viewable by all" 
ON freelancer_profiles FOR SELECT 
USING (true);

-- 1.3 Jobs: Update policy to include new columns
DROP POLICY IF EXISTS "Jobs viewable by all" ON jobs;

CREATE POLICY "Jobs viewable by all" 
ON jobs FOR SELECT 
USING (
  status = 'open' OR 
  auth.uid() = client_id OR
  auth.uid() IN (
    SELECT freelancer_id FROM proposals WHERE job_id = jobs.id
  )
);

-- 1.4 Storage bucket for voice intros
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-intros', 'voice-intros', true)
ON CONFLICT (id) DO NOTHING;

-- Voice intro storage policies
DROP POLICY IF EXISTS "Voice intros publicly accessible" ON storage.objects;
CREATE POLICY "Voice intros publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'voice-intros');

DROP POLICY IF EXISTS "Users can upload own voice intro" ON storage.objects;
CREATE POLICY "Users can upload own voice intro" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'voice-intros' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own voice intro" ON storage.objects;
CREATE POLICY "Users can delete own voice intro" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'voice-intros' AND
  auth.uid()::text = (storage.foldername(name))[1]
);


-- ============================================
-- SECTION 2: PERFORMANCE INDEXES
-- ============================================

-- 2.1 Username lookups (for profile URLs like /freelancer/username)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON profiles(LOWER(username));

-- 2.2 Freelancer stats for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_freelancer_success_rate 
ON freelancer_profiles(success_rate DESC);

CREATE INDEX IF NOT EXISTS idx_freelancer_repeat_clients 
ON freelancer_profiles(repeat_clients DESC);

CREATE INDEX IF NOT EXISTS idx_freelancer_profile_views 
ON freelancer_profiles(profile_views DESC);

-- 2.3 Job metrics for sorting
CREATE INDEX IF NOT EXISTS idx_jobs_views_count 
ON jobs(views_count DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_proposals_count 
ON jobs(proposals_count DESC);

-- 2.4 CIN verification queries (for admin panel)
CREATE INDEX IF NOT EXISTS idx_profiles_cin_verified 
ON profiles(cin_verified) 
WHERE cin_verified = true;

-- 2.5 Composite index for job search
CREATE INDEX IF NOT EXISTS idx_jobs_status_created 
ON jobs(status, created_at DESC);


-- ============================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================

-- 3.1 Function to increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views(freelancer_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE freelancer_profiles 
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id = freelancer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Function to check username availability
CREATE OR REPLACE FUNCTION check_username_available(username_to_check TEXT, user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE LOWER(username) = LOWER(username_to_check)
    AND (user_id IS NULL OR id != user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- VERIFICATION QUERIES (run manually)
-- ============================================

-- Check all policies are created:
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- Check indexes created:
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

-- Test username uniqueness function:
-- SELECT check_username_available('test_username');
