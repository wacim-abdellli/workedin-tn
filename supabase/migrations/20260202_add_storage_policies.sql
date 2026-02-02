-- Storage Policies Migration
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================
-- 1. CREATE STORAGE BUCKETS (if not exists)
-- ============================================

-- Note: This needs to be run in Supabase Dashboard
-- Go to Storage > Create bucket and create:
-- 1. avatars (public)
-- 2. portfolio (public)
-- 3. voice_intros (public)

-- ============================================
-- 2. STORAGE RLS POLICIES
-- ============================================

-- AVATARS BUCKET POLICIES
-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Allow users to update/delete their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- PORTFOLIO BUCKET POLICIES
CREATE POLICY "Anyone can view portfolio"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

CREATE POLICY "Users can upload to portfolio"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'portfolio' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own portfolio files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'portfolio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own portfolio files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'portfolio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- VOICE_INTROS BUCKET POLICIES
CREATE POLICY "Anyone can view voice intros"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice_intros');

CREATE POLICY "Users can upload voice intro"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'voice_intros' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own voice intro"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'voice_intros' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own voice intro"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'voice_intros' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload config';
