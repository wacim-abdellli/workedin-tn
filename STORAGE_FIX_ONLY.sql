-- ============================================
-- STORAGE POLICIES ONLY FIX
-- Run this in Supabase SQL Editor
-- ============================================
-- This script ONLY adds storage policies
-- It does NOT touch database tables

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

-- DONE!
SELECT 
    b.name as bucket_name,
    COUNT(p.policyname) as policy_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.schemaname = 'storage'
WHERE b.id IN ('avatars', 'portfolio', 'voice_intros')
GROUP BY b.name
ORDER BY b.name;

SELECT '✅ Storage policies created successfully!' AS status;
