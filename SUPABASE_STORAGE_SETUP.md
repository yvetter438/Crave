# Supabase Storage Setup for UGC Video Uploads

## Overview
This guide will help you configure Supabase Storage buckets for user-generated video content with proper moderation controls.

## Storage Bucket Configuration

**Note**: If you have an existing `posts-videos` bucket from development, keep it! The new system uses a separate `videos` bucket for moderated uploads.

### Bucket Structure:
- **`videos`** (private) - New user uploads, pending moderation
- **`posts-videos`** (public) - Old/existing approved videos (if you have them)

### 1. Create Videos Bucket (For New Uploads)

1. Go to **Storage** in your Supabase Dashboard
2. Click **Create a new bucket**
3. Configure as follows:
   - **Name**: `videos`
   - **Public bucket**: ❌ **NO** (Keep it private for moderation)
   - **File size limit**: 100 MB (or your preferred limit)
   - **Allowed MIME types**: `video/*` (accepts all video formats - recommended for mobile compatibility)

### 2. Storage Policies for Videos Bucket

After creating the bucket, go to **Storage > Policies** and add these policies:

#### Policy 1: Users can upload their own videos
```sql
CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Explanation**: Videos are uploaded to paths like `{user_id}/{filename}`. This policy ensures users can only upload to their own folder.

#### Policy 2: Users can read their own videos
```sql
CREATE POLICY "Users can view own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Explanation**: Authors can view their uploaded videos even if the post is still pending moderation.

#### Policy 3: Public can read videos of approved posts
```sql
CREATE POLICY "Public can view approved videos"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM posts
    WHERE posts.video_url = storage.objects.name
    AND posts.status = 'approved'
  )
);
```

**Explanation**: Videos are only publicly accessible if the associated post has been approved.

#### Policy 4: Users can update their own pending videos
```sql
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 5: Users can delete their own videos
```sql
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Optional: Thumbnails Bucket

If you want to store video thumbnails separately:

1. Create a new bucket named `thumbnails`
2. **Public bucket**: ✅ **YES** (Thumbnails can be public)
3. Apply similar policies as above

## File Naming Convention

To ensure proper organization and security:

```
videos/{user_id}/{timestamp}_{random}.mp4
```

Example:
```
videos/550e8400-e29b-41d4-a716-446655440000/1730000000_abc123.mp4
```

This ensures:
- Easy filtering by user
- No filename conflicts
- Proper RLS enforcement

## Storage Helper Functions (Optional)

You can create helper functions for common storage operations:

```sql
-- Function to generate video storage path
CREATE OR REPLACE FUNCTION generate_video_path(file_extension TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_str TEXT;
  timestamp_str TEXT;
  random_str TEXT;
BEGIN
  user_id_str := auth.uid()::TEXT;
  timestamp_str := EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
  random_str := substr(md5(random()::text), 1, 8);
  
  RETURN format('%s/%s_%s.%s', user_id_str, timestamp_str, random_str, file_extension);
END;
$$;

GRANT EXECUTE ON FUNCTION generate_video_path(TEXT) TO authenticated;
```

## Client-Side Usage

### Upload a video

```typescript
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

async function uploadVideo(videoUri: string, userId: string) {
  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const fileExtension = videoUri.split('.').pop() || 'mp4';
  const fileName = `${userId}/${timestamp}_${random}.${fileExtension}`;

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(videoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convert to blob
  const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, arrayBuffer, {
      contentType: 'video/mp4',
      upsert: false,
    });

  if (error) throw error;
  
  return fileName; // Store this in posts.video_url
}
```

### Get video URL

```typescript
// For approved posts (public URL)
const { data } = supabase.storage
  .from('videos')
  .getPublicUrl(fileName);

// For pending posts (signed URL - 1 hour expiry)
const { data, error } = await supabase.storage
  .from('videos')
  .createSignedUrl(fileName, 3600); // 1 hour
```

## Security Checklist

- ✅ Videos bucket is **private**
- ✅ Only authenticated users can upload
- ✅ Users can only upload to their own folder
- ✅ Public can only access videos from approved posts
- ✅ File size limits are set
- ✅ MIME type restrictions are in place

## Troubleshooting

### Error: "new row violates row-level security policy"
- Check that the user is authenticated
- Verify the file path follows the `{user_id}/{filename}` format
- Ensure the storage policies are created correctly

### Videos not loading in feed
- Check that posts.status = 'approved'
- Verify the video_url in posts matches the storage path
- Use signed URLs for pending posts, public URLs for approved posts

## Next Steps

After configuring storage:

1. ✅ Test upload with a sample user
2. ✅ Verify pending videos are only visible to author
3. ✅ Approve a post and verify video becomes publicly accessible
4. ✅ Test file size limits
5. ✅ Test blocked MIME types (e.g., try uploading a .exe file)

---

**Note**: Always test these policies in a development environment before applying to production!

