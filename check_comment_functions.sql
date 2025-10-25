-- ============================================
-- CHECK: Comment Functions Status
-- Run this in Supabase SQL Editor to diagnose
-- ============================================

-- Check if the moderation functions exist
SELECT 
  routine_name as function_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%comment%'
ORDER BY routine_name;

-- Check if comments table has the status column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'comments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check a sample comment to see its status
SELECT id, post_id, user_id, text, status, created_at
FROM comments 
ORDER BY created_at DESC 
LIMIT 5;

-- Test the get_comments_with_moderation function directly
-- (This will show if the function works)
SELECT * FROM get_comments_with_moderation(1, null) LIMIT 3;
