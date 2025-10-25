-- ============================================
-- VERIFY PROFILE ENHANCEMENTS MIGRATION
-- Run this to confirm everything is set up correctly
-- ============================================

-- 1. Check new columns were added to profiles
SELECT 
  '✓ NEW COLUMNS' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('bio', 'location', 'instagram_handle', 'followers_count', 'following_count', 'likes_count')
ORDER BY column_name;

-- 2. Check followers table was created
SELECT 
  '✓ FOLLOWERS TABLE' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'followers'
ORDER BY ordinal_position;

-- 3. Check new functions exist
SELECT
  '✓ NEW FUNCTIONS' as check_name,
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'get_user_profile',
    'is_following', 
    'get_followers',
    'get_following',
    'update_follower_counts',
    'update_user_likes_count'
  )
ORDER BY routine_name;

-- 4. Check triggers were created
SELECT
  '✓ TRIGGERS' as check_name,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('trigger_update_follower_counts', 'trigger_update_user_likes_count')
ORDER BY trigger_name;

-- 5. Check RLS policies on followers table
SELECT
  '✓ FOLLOWERS RLS' as check_name,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'followers'
ORDER BY policyname;

-- ============================================
-- If all 5 checks show results, migration was successful! ✓
-- ============================================

