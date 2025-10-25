-- ============================================
-- FIX: Enhanced UGC Moderation Migration
-- This script fixes the incomplete migration
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Create the main moderation functions
-- ============================================

-- Drop if exists first to avoid conflicts
DROP FUNCTION IF EXISTS get_comments_with_moderation(bigint, uuid) CASCADE;

-- Function to get comments with moderation (filters blocked users)
CREATE FUNCTION get_comments_with_moderation(
  p_post_id bigint,
  p_user_id uuid
)
RETURNS TABLE (
  id bigint,
  post_id bigint,
  user_id uuid,
  parent_comment_id bigint,
  text text,
  created_at timestamptz,
  username text,
  displayname text,
  avatar_url text,
  likes_count bigint,
  replies_count bigint,
  is_liked_by_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.parent_comment_id,
    c.text,
    c.created_at,
    p.username,
    p.displayname,
    p.avatar_url,
    COALESCE(COUNT(DISTINCT cl.id), 0) as likes_count,
    COALESCE(COUNT(DISTINCT replies.id), 0) as replies_count,
    EXISTS(
      SELECT 1 FROM comment_likes 
      WHERE comment_id = c.id 
      AND user_id = p_user_id
    ) as is_liked_by_user
  FROM comments c
  INNER JOIN profiles p ON p.user_id = c.user_id
  LEFT JOIN comment_likes cl ON cl.comment_id = c.id
  LEFT JOIN comments replies ON replies.parent_comment_id = c.id
  WHERE 
    c.post_id = p_post_id
    -- Only show visible comments (not removed)
    AND c.status = 'visible'
    -- Filter out comments from blocked users
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      WHERE ub.blocker_id = p_user_id
      AND ub.blocked_id = c.user_id
    )
  GROUP BY c.id, c.post_id, c.user_id, c.parent_comment_id, c.text, 
           c.created_at, p.username, p.displayname, p.avatar_url
  ORDER BY c.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_comments_with_moderation(bigint, uuid) TO authenticated;

-- ============================================
-- STEP 2: Create comment replies function
-- ============================================

-- Drop if exists first
DROP FUNCTION IF EXISTS get_comment_replies_with_moderation(bigint, uuid) CASCADE;

CREATE FUNCTION get_comment_replies_with_moderation(
  p_parent_comment_id bigint,
  p_user_id uuid
)
RETURNS TABLE (
  id bigint,
  post_id bigint,
  user_id uuid,
  parent_comment_id bigint,
  text text,
  created_at timestamptz,
  username text,
  displayname text,
  avatar_url text,
  likes_count bigint,
  replies_count bigint,
  is_liked_by_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.parent_comment_id,
    c.text,
    c.created_at,
    p.username,
    p.displayname,
    p.avatar_url,
    COALESCE(COUNT(DISTINCT cl.id), 0) as likes_count,
    0::bigint as replies_count,
    EXISTS(
      SELECT 1 FROM comment_likes 
      WHERE comment_id = c.id 
      AND user_id = p_user_id
    ) as is_liked_by_user
  FROM comments c
  INNER JOIN profiles p ON p.user_id = c.user_id
  LEFT JOIN comment_likes cl ON cl.comment_id = c.id
  WHERE 
    c.parent_comment_id = p_parent_comment_id
    AND c.status = 'visible'
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      WHERE ub.blocker_id = p_user_id
      AND ub.blocked_id = c.user_id
    )
  GROUP BY c.id, c.post_id, c.user_id, c.parent_comment_id, c.text, 
           c.created_at, p.username, p.displayname, p.avatar_url
  ORDER BY c.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_comment_replies_with_moderation(bigint, uuid) TO authenticated;

-- ============================================
-- STEP 3: Create blocked users list function
-- ============================================

-- Drop if exists first
DROP FUNCTION IF EXISTS get_blocked_users(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_blocked_users(p_user_id uuid) CASCADE;

CREATE FUNCTION get_blocked_users(p_user_id uuid)
RETURNS TABLE (
  blocked_id uuid,
  blocked_username text,
  blocked_displayname text,
  blocked_avatar_url text,
  blocked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ub.blocked_id,
    p.username as blocked_username,
    p.displayname as blocked_displayname,
    p.avatar_url as blocked_avatar_url,
    ub.created_at as blocked_at
  FROM user_blocks ub
  INNER JOIN profiles p ON p.user_id = ub.blocked_id
  WHERE ub.blocker_id = p_user_id
  ORDER BY ub.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_blocked_users(uuid) TO authenticated;

-- ============================================
-- STEP 4: Replace is_user_blocked function
-- ============================================

-- Drop ALL possible versions
DROP FUNCTION IF EXISTS is_user_blocked(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_user_blocked(target_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS is_user_blocked(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS is_user_blocked(blocker_id_param uuid, blocked_id_param uuid) CASCADE;

-- Create the correct version
CREATE FUNCTION is_user_blocked(
  blocker_id_param uuid,
  blocked_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_blocks
    WHERE blocker_id = blocker_id_param
    AND blocked_id = blocked_id_param
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_user_blocked(uuid, uuid) TO authenticated;

-- ============================================
-- STEP 5: Update get_comments_with_metadata
-- ============================================

-- Drop the old function completely first
DROP FUNCTION IF EXISTS get_comments_with_metadata(bigint, uuid) CASCADE;

-- Create the new version that uses moderation
CREATE FUNCTION get_comments_with_metadata(
  p_post_id bigint,
  p_user_id uuid
)
RETURNS TABLE (
  id bigint,
  post_id bigint,
  user_id uuid,
  parent_comment_id bigint,
  text text,
  created_at timestamptz,
  username text,
  displayname text,
  avatar_url text,
  likes_count bigint,
  replies_count bigint,
  is_liked_by_user boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM get_comments_with_moderation(p_post_id, p_user_id);
$$;

GRANT EXECUTE ON FUNCTION get_comments_with_metadata(bigint, uuid) TO authenticated;

-- ============================================
-- STEP 6: Ensure comments table has status column
-- ============================================

-- Add status column to comments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'status'
  ) THEN
    ALTER TABLE comments 
    ADD COLUMN status TEXT DEFAULT 'visible' 
    CHECK (status IN ('visible', 'removed'));
    
    -- Update existing comments to visible
    UPDATE comments SET status = 'visible' WHERE status IS NULL;
    
    -- Make NOT NULL after setting defaults
    ALTER TABLE comments ALTER COLUMN status SET NOT NULL;
    
    RAISE NOTICE '✅ Added status column to comments table';
  ELSE
    RAISE NOTICE 'ℹ️  Status column already exists in comments table';
  END IF;
END $$;

-- Add removed tracking columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'removed_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN removed_at TIMESTAMPTZ;
    ALTER TABLE comments ADD COLUMN removed_reason TEXT;
    RAISE NOTICE '✅ Added removed_at and removed_reason to comments';
  END IF;
END $$;

-- ============================================
-- STEP 7: Create missing indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_blocked 
ON user_blocks(blocker_id, blocked_id);

CREATE INDEX IF NOT EXISTS idx_comments_status_visible 
ON comments(status) WHERE status = 'visible';

CREATE INDEX IF NOT EXISTS idx_posts_status_approved 
ON posts(status) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_reports_status_pending 
ON reports(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reports_target_composite 
ON reports(target_type, target_id, status);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that all functions exist
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN (
    'get_comments_with_moderation',
    'get_comment_replies_with_moderation',
    'is_user_blocked',
    'get_blocked_users',
    'get_comments_with_metadata'
  );
  
  IF func_count = 5 THEN
    RAISE NOTICE '✅ All 5 functions created successfully';
  ELSE
    RAISE NOTICE '❌ Only % functions created (expected 5)', func_count;
  END IF;
END $$;

-- Check indexes
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_user_blocks_blocker_blocked',
    'idx_user_blocks_blocked',
    'idx_comments_status_visible',
    'idx_posts_status_approved',
    'idx_reports_status_pending',
    'idx_reports_target_composite'
  );
  
  IF idx_count >= 5 THEN
    RAISE NOTICE '✅ All indexes created successfully';
  ELSE
    RAISE NOTICE '⚠️  Only % indexes created (expected 6)', idx_count;
  END IF;
END $$;

RAISE NOTICE '🎉 Migration complete! Test the app now.';

