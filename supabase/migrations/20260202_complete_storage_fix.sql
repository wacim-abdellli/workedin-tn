-- ============================================
-- COMPLETE ONBOARDING FIX SCRIPT
-- Run this ONCE in Supabase SQL Editor
-- ============================================
-- This script fixes all storage and database issues

-- 1. CREATE MISSING STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('portfolio', 'portfolio', true, 10485760, ARRAY['image/*', 'video/*', 'application/pdf']),
    ('voice_intros', 'voice_intros', true, 5242880, ARRAY['audio/*'])
ON CONFLICT (id) DO NOTHING;

-- 2. ADD STORAGE RLS POLICIES FOR AVATARS
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
);

-- 3. ADD STORAGE RLS POLICIES FOR PORTFOLIO
DROP POLICY IF EXISTS "Anyone can view portfolio" ON storage.objects;
CREATE POLICY "Anyone can view portfolio"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "Authenticated users can upload portfolio" ON storage.objects;
CREATE POLICY "Authenticated users can upload portfolio"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'portfolio' 
    AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update portfolio" ON storage.objects;
CREATE POLICY "Users can update portfolio"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'portfolio'
    AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete portfolio" ON storage.objects;
CREATE POLICY "Users can delete portfolio"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'portfolio'
    AND auth.role() = 'authenticated'
);

-- 4. ADD STORAGE RLS POLICIES FOR VOICE INTROS
DROP POLICY IF EXISTS "Anyone can view voice intros" ON storage.objects;
CREATE POLICY "Anyone can view voice intros"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice_intros');

DROP POLICY IF EXISTS "Authenticated users can upload voice intros" ON storage.objects;
CREATE POLICY "Authenticated users can upload voice intros"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'voice_intros' 
    AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update voice intros" ON storage.objects;
CREATE POLICY "Users can update voice intros"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'voice_intros'
    AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete voice intros" ON storage.objects;
CREATE POLICY "Users can delete voice intros"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'voice_intros'
    AND auth.role() = 'authenticated'
);

-- 5. VERIFY DATABASE RLS POLICIES (Already set, but verify)
DO $$
BEGIN
    -- Profiles INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" 
        ON profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;

    -- Profiles UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" 
        ON profiles FOR UPDATE 
        USING (auth.uid() = id);
    END IF;

    -- Freelancer Profiles INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'freelancer_profiles' AND policyname = 'Freelancers can insert own profile'
    ) THEN
        CREATE POLICY "Freelancers can insert own profile" 
        ON freelancer_profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;

    -- Freelancer Profiles UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'freelancer_profiles' AND policyname = 'Freelancers can update own profile'
    ) THEN
        CREATE POLICY "Freelancers can update own profile" 
        ON freelancer_profiles FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END $$;

-- 6. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload config';

-- VERIFICATION QUERIES
SELECT 
    'Storage Buckets' as check_type,
    COUNT(*) as count 
FROM storage.buckets 
WHERE id IN ('avatars', 'portfolio', 'voice_intros');

SELECT 
    'Storage Policies' as check_type,
    COUNT(*) as count 
FROM pg_policies 
WHERE schemaname = 'storage';

SELECT 
    'Profile Policies' as check_type,
    COUNT(*) as count 
FROM pg_policies 
WHERE tablename IN ('profiles', 'freelancer_profiles');

-- Done!
SELECT '✅ All storage policies created successfully!' AS status;
