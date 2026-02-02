-- HOTFIX: Storage Policies for 406 errors
-- Run this in Supabase SQL Editor

-- First, drop any conflicting policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;

-- Create clean, working policies for avatars bucket
-- SELECT: Anyone can view
CREATE POLICY "avatars_select_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- INSERT: Authenticated users can upload
CREATE POLICY "avatars_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- UPDATE: Authenticated users can update
CREATE POLICY "avatars_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

-- DELETE: Authenticated users can delete
CREATE POLICY "avatars_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

-- Verify policies
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
