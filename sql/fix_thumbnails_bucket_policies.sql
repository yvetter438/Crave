-- Fix RLS policies for posts-thumbnails bucket
-- This allows authenticated users to upload and view thumbnails

-- First, ensure the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'posts-thumbnails';

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "thumbnails_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails_public_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails_update_own_policy" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails_delete_own_policy" ON storage.objects;

-- Allow authenticated users to INSERT (upload) thumbnails to posts-thumbnails bucket
CREATE POLICY "thumbnails_upload_policy" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'posts-thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public SELECT (view) access to thumbnails in posts-thumbnails bucket
CREATE POLICY "thumbnails_public_view_policy" ON storage.objects
  FOR SELECT 
  TO public
  USING (bucket_id = 'posts-thumbnails');

-- Allow users to UPDATE their own thumbnails in posts-thumbnails bucket
CREATE POLICY "thumbnails_update_own_policy" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'posts-thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'posts-thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to DELETE their own thumbnails in posts-thumbnails bucket
CREATE POLICY "thumbnails_delete_own_policy" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'posts-thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Verify the policies were created
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
  AND schemaname = 'storage'
  AND policyname LIKE '%thumbnails%'
ORDER BY policyname;
