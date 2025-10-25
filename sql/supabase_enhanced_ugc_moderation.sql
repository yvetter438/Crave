-- ============================================
-- ENHANCED UGC MODERATION FOR APPLE APP STORE
-- Profanity Filtering, User Blocking, Comment Moderation
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: COMMENT MODERATION FUNCTION
-- Filters out comments from blocked users
-- ============================================

CREATE OR REPLACE FUNCTION get_comments_with_moderation(
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_comments_with_moderation(bigint, uuid) TO authenticated;

COMMENT ON FUNCTION get_comments_with_moderation IS 
'Fetches comments for a post with moderation filters applied: excludes blocked users and removed comments';

-- ============================================
-- PART 2: COMMENT REPLIES WITH MODERATION
-- Filters out replies from blocked users
-- ============================================

CREATE OR REPLACE FUNCTION get_comment_replies_with_moderation(
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
    0::bigint as replies_count, -- Replies don't have sub-replies
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_comment_replies_with_moderation(bigint, uuid) TO authenticated;

COMMENT ON FUNCTION get_comment_replies_with_moderation IS 
'Fetches replies to a comment with moderation filters applied';

-- ============================================
-- PART 3: RLS POLICIES FOR USER BLOCKS
-- Ensure users can manage their own blocks
-- ============================================

-- Enable RLS on user_blocks table
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can block other users" ON user_blocks;
DROP POLICY IF EXISTS "Users can unblock users" ON user_blocks;

-- Policy: Users can view their own blocks
CREATE POLICY "Users can view their own blocks"
ON user_blocks
FOR SELECT
TO authenticated
USING (blocker_id = auth.uid());

-- Policy: Users can create blocks (block other users)
CREATE POLICY "Users can block other users"
ON user_blocks
FOR INSERT
TO authenticated
WITH CHECK (
  blocker_id = auth.uid() 
  AND blocker_id != blocked_id
);

-- Policy: Users can delete their own blocks (unblock)
CREATE POLICY "Users can unblock users"
ON user_blocks
FOR DELETE
TO authenticated
USING (blocker_id = auth.uid());

COMMENT ON POLICY "Users can view their own blocks" ON user_blocks IS 
'Users can only see the list of users they have blocked';

COMMENT ON POLICY "Users can block other users" ON user_blocks IS 
'Users can block other users but not themselves';

COMMENT ON POLICY "Users can unblock users" ON user_blocks IS 
'Users can remove blocks they have created';

-- ============================================
-- PART 4: RLS POLICIES FOR REPORTS
-- Ensure users can submit reports but not view others' reports
-- ============================================

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Users can submit reports" ON reports;
DROP POLICY IF EXISTS "Moderators can view all reports" ON reports;
DROP POLICY IF EXISTS "Moderators can update reports" ON reports;

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON reports
FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- Policy: Users can create reports
CREATE POLICY "Users can submit reports"
ON reports
FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- Policy: Moderators can view all reports
CREATE POLICY "Moderators can view all reports"
ON reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM moderators
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Policy: Moderators can update report status
CREATE POLICY "Moderators can update reports"
ON reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM moderators
    WHERE user_id = auth.uid()
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM moderators
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

COMMENT ON POLICY "Users can view their own reports" ON reports IS 
'Users can only see reports they have submitted';

COMMENT ON POLICY "Users can submit reports" ON reports IS 
'Authenticated users can submit reports for posts, comments, or users';

COMMENT ON POLICY "Moderators can view all reports" ON reports IS 
'Moderators have access to view all reports for review';

-- ============================================
-- PART 5: INDEXES FOR PERFORMANCE
-- Optimize queries for blocked users and moderation
-- ============================================

-- Index for checking if a user is blocked (used in many queries)
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_blocked 
ON user_blocks(blocker_id, blocked_id);

-- Index for reverse lookup (finding who blocked a user)
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked 
ON user_blocks(blocked_id);

-- Index for comment status filtering
CREATE INDEX IF NOT EXISTS idx_comments_status_visible 
ON comments(status) WHERE status = 'visible';

-- Index for post status filtering
CREATE INDEX IF NOT EXISTS idx_posts_status_approved 
ON posts(status) WHERE status = 'approved';

-- Index for reports by status (for moderator dashboard)
CREATE INDEX IF NOT EXISTS idx_reports_status_pending 
ON reports(status) WHERE status = 'pending';

-- Index for reports by target (finding all reports for a specific post/comment/user)
CREATE INDEX IF NOT EXISTS idx_reports_target_composite 
ON reports(target_type, target_id, status);

COMMENT ON INDEX idx_user_blocks_blocker_blocked IS 
'Optimizes queries checking if user A blocked user B';

COMMENT ON INDEX idx_comments_status_visible IS 
'Optimizes queries filtering for visible comments only';

-- ============================================
-- PART 6: HELPER FUNCTIONS
-- Drop and recreate helper functions to avoid duplicates
-- ============================================

-- Drop existing helper functions if they exist (with CASCADE to handle dependencies)
-- Using DO block to handle multiple overloaded versions
DO $$ 
BEGIN
  -- Drop all versions of is_user_blocked
  DROP FUNCTION IF EXISTS is_user_blocked(uuid, uuid) CASCADE;
  DROP FUNCTION IF EXISTS is_user_blocked(blocker_id_param uuid, blocked_id_param uuid) CASCADE;
  
  -- Drop get_blocked_users
  DROP FUNCTION IF EXISTS get_blocked_users(uuid) CASCADE;
  DROP FUNCTION IF EXISTS get_blocked_users(p_user_id uuid) CASCADE;
  
  -- Drop get_comments_with_metadata
  DROP FUNCTION IF EXISTS get_comments_with_metadata(bigint, uuid) CASCADE;
  DROP FUNCTION IF EXISTS get_comments_with_metadata(p_post_id bigint, p_user_id uuid) CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if functions don't exist
    NULL;
END $$;

-- Helper function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(
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

COMMENT ON FUNCTION is_user_blocked IS 
'Helper function to check if one user has blocked another';

-- ============================================
-- PART 7: LEGACY FUNCTION COMPATIBILITY
-- Maintain backwards compatibility with existing code
-- ============================================

-- Legacy function: get_comments_with_metadata (already dropped above)
-- Now an alias to the new moderation-aware function
CREATE OR REPLACE FUNCTION get_comments_with_metadata(
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

COMMENT ON FUNCTION get_comments_with_metadata IS 
'Legacy function name maintained for backwards compatibility - now uses moderation filters';

-- ============================================
-- PART 8: BLOCKED USERS MANAGEMENT
-- Function to get list of blocked users
-- ============================================

CREATE OR REPLACE FUNCTION get_blocked_users(p_user_id uuid)
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

COMMENT ON FUNCTION get_blocked_users IS 
'Returns list of users that the specified user has blocked';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify new functions exist:
-- SELECT proname FROM pg_proc WHERE proname LIKE '%moderation%';

-- Verify RLS policies exist:
-- SELECT * FROM pg_policies WHERE tablename IN ('user_blocks', 'reports');

-- Verify indexes exist:
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('user_blocks', 'comments', 'posts', 'reports');

-- Test blocking function:
-- SELECT is_user_blocked('user1-uuid'::uuid, 'user2-uuid'::uuid);

-- ============================================
-- NOTES FOR IMPLEMENTATION:
-- ============================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Update CommentReplies component to use get_comment_replies_with_moderation
-- 3. Client-side profanity filter is already implemented in profanityFilter.ts
-- 4. All feeds now filter blocked users and only show approved content
-- 5. Users can block others from VideoPost and Comment components
-- 6. Reports can be submitted for posts, comments, and users
-- 7. Moderators can view and manage reports through the moderator dashboard

-- ============================================
-- APPLE APP STORE COMPLIANCE CHECKLIST:
-- ============================================
-- ✅ Profanity filtering before comment posting
-- ✅ Report system for offensive comments
-- ✅ Report system for videos/posts
-- ✅ Block abusive users functionality
-- ✅ Hide blocked users' comments from feed
-- ✅ Hide blocked users' videos from feed
-- ✅ Integrates with existing moderation system
-- ✅ RLS policies for data security
-- ✅ Performance optimized with indexes

