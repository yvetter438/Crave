-- Fix Storage Policies for Moderation System
-- Run this in Supabase SQL Editor to allow moderators to upload approved videos

-- ============================================
-- POSTS-VIDEOS BUCKET POLICIES (Public Bucket)
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view approved videos" ON storage.objects;
DROP POLICY IF EXISTS "Moderators can upload approved videos" ON storage.objects;
DROP POLICY IF EXISTS "Moderators can delete approved videos" ON storage.objects;

-- Policy 1: Everyone can view videos in posts-videos bucket
CREATE POLICY "Public can view approved videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts-videos');

-- Policy 2: Moderators can upload to posts-videos bucket
CREATE POLICY "Moderators can upload approved videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts-videos' 
  AND is_moderator(auth.uid())
);

-- Policy 3: Moderators can delete from posts-videos bucket
CREATE POLICY "Moderators can delete approved videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts-videos' 
  AND is_moderator(auth.uid())
);

-- ============================================
-- VIDEOS BUCKET POLICIES (Private Bucket)
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own videos" ON storage.objects;
DROP POLICY IF EXISTS "Moderators can read all videos" ON storage.objects;
DROP POLICY IF EXISTS "Moderators can delete videos" ON storage.objects;

-- Policy 1: Authenticated users can upload to their own folder in videos bucket
CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can read their own videos
CREATE POLICY "Users can read own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Moderators can read all videos in private bucket (for review)
CREATE POLICY "Moderators can read all videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos'
  AND is_moderator(auth.uid())
);

-- Policy 4: Moderators can delete videos (cleanup after approval)
CREATE POLICY "Moderators can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos'
  AND is_moderator(auth.uid())
);

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- Check all storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- Test if you're a moderator
SELECT is_moderator(auth.uid()) as am_i_moderator;

