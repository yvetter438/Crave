-- ============================================
-- UGC MODERATION - ROW LEVEL SECURITY POLICIES
-- Apple App Store Compliance
-- Run this AFTER supabase_ugc_moderation_migration.sql
-- ============================================

-- ============================================
-- PART 1: POSTS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on posts table (if not already enabled)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Public can view approved posts" ON posts;
DROP POLICY IF EXISTS "Authors can view own posts" ON posts;
DROP POLICY IF EXISTS "Moderators can view all posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can insert pending posts" ON posts;
DROP POLICY IF EXISTS "Authors can update own pending posts" ON posts;
DROP POLICY IF EXISTS "Moderators can update any post" ON posts;
DROP POLICY IF EXISTS "Authors can delete own pending posts" ON posts;

-- SELECT: Public can only view approved posts
CREATE POLICY "Public can view approved posts"
  ON posts FOR SELECT
  TO public
  USING (status = 'approved');

-- SELECT: Authors can view their own posts (even if pending)
CREATE POLICY "Authors can view own posts"
  ON posts FOR SELECT
  TO authenticated
  USING (auth.uid() = "user" OR status = 'approved');

-- SELECT: Moderators can view all posts
CREATE POLICY "Moderators can view all posts"
  ON posts FOR SELECT
  TO authenticated
  USING (is_moderator(auth.uid()));

-- INSERT: Authenticated users can create posts (default status = 'pending')
CREATE POLICY "Authenticated users can insert pending posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = "user" 
    AND (status = 'pending' OR status IS NULL)
  );

-- UPDATE: Authors can update their own pending posts
CREATE POLICY "Authors can update own pending posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = "user" AND status = 'pending')
  WITH CHECK (auth.uid() = "user" AND status = 'pending');

-- UPDATE: Moderators can update any post (approve/remove)
CREATE POLICY "Moderators can update any post"
  ON posts FOR UPDATE
  TO authenticated
  USING (is_moderator(auth.uid()))
  WITH CHECK (is_moderator(auth.uid()));

-- DELETE: Authors can delete their own pending posts
CREATE POLICY "Authors can delete own pending posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = "user" AND status = 'pending');

-- ============================================
-- PART 2: COMMENTS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on comments table (if not already enabled)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view visible comments" ON comments;
DROP POLICY IF EXISTS "Authors can view own comments" ON comments;
DROP POLICY IF EXISTS "Moderators can view all comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Authors can update own comments" ON comments;
DROP POLICY IF EXISTS "Moderators can update any comment" ON comments;
DROP POLICY IF EXISTS "Authors can delete own comments" ON comments;

-- SELECT: Public can only view visible comments on approved posts
CREATE POLICY "Public can view visible comments"
  ON comments FOR SELECT
  TO public
  USING (
    status = 'visible' 
    AND EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id 
      AND posts.status = 'approved'
    )
  );

-- SELECT: Authors can view their own comments
CREATE POLICY "Authors can view own comments"
  ON comments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR status = 'visible');

-- SELECT: Moderators can view all comments
CREATE POLICY "Moderators can view all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (is_moderator(auth.uid()));

-- INSERT: Authenticated users can create comments (default status = 'visible')
CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (status = 'visible' OR status IS NULL)
  );

-- UPDATE: Authors can update their own visible comments
CREATE POLICY "Authors can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'visible')
  WITH CHECK (auth.uid() = user_id AND status = 'visible');

-- UPDATE: Moderators can update any comment
CREATE POLICY "Moderators can update any comment"
  ON comments FOR UPDATE
  TO authenticated
  USING (is_moderator(auth.uid()))
  WITH CHECK (is_moderator(auth.uid()));

-- DELETE: Authors can delete their own comments
CREATE POLICY "Authors can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- PART 3: REPORTS TABLE RLS POLICIES
-- ============================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Moderators can view all reports" ON reports;
DROP POLICY IF EXISTS "Users can insert reports" ON reports;
DROP POLICY IF EXISTS "Moderators can update reports" ON reports;

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Moderators can view all reports
CREATE POLICY "Moderators can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (is_moderator(auth.uid()));

-- Authenticated users can create reports
CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Only moderators can update reports (mark as reviewed/resolved)
CREATE POLICY "Moderators can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (is_moderator(auth.uid()))
  WITH CHECK (is_moderator(auth.uid()));

-- ============================================
-- PART 4: USER_BLOCKS TABLE RLS POLICIES
-- ============================================

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can insert blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can delete own blocks" ON user_blocks;

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can insert blocks"
  ON user_blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete own blocks"
  ON user_blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- ============================================
-- PART 5: MODERATORS TABLE RLS POLICIES
-- ============================================

ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Moderators can view moderators" ON moderators;
DROP POLICY IF EXISTS "Moderators can insert moderators" ON moderators;
DROP POLICY IF EXISTS "Moderators can update moderators" ON moderators;

-- Only moderators can view moderator list
CREATE POLICY "Moderators can view moderators"
  ON moderators FOR SELECT
  TO authenticated
  USING (is_moderator(auth.uid()));

-- Only existing moderators can add new moderators
CREATE POLICY "Moderators can insert moderators"
  ON moderators FOR INSERT
  TO authenticated
  WITH CHECK (is_moderator(auth.uid()));

-- Only moderators can update moderator status
CREATE POLICY "Moderators can update moderators"
  ON moderators FOR UPDATE
  TO authenticated
  USING (is_moderator(auth.uid()))
  WITH CHECK (is_moderator(auth.uid()));

-- ============================================
-- PART 6: HELPER FUNCTIONS FOR BLOCKED USERS
-- ============================================

-- Function to check if a user is blocked by the current user
CREATE OR REPLACE FUNCTION is_user_blocked(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_blocks 
    WHERE blocker_id = auth.uid() 
    AND blocked_id = target_user_id
  );
END;
$$;

-- Function to get feed posts excluding blocked users
CREATE OR REPLACE FUNCTION get_ranked_feed_with_moderation(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_seed FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id BIGINT,
  created_at TIMESTAMPTZ,
  video_url TEXT,
  description TEXT,
  user_id UUID,
  restaurant BIGINT,
  score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH post_stats AS (
    SELECT 
      p.id,
      p.created_at,
      p.video_url,
      p.description,
      p."user" as user_id,
      p.restaurant,
      EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0 as age_hours,
      COALESCE(COUNT(DISTINCT l.id), 0) as likes_count,
      COALESCE(COUNT(DISTINCT s.id), 0) as saves_count,
      COALESCE(COUNT(DISTINCT w.id), 0) as watches_count
    FROM posts p
    LEFT JOIN likes l ON l.post_id = p.id
    LEFT JOIN saves s ON s.post_id = p.id
    LEFT JOIN watch_events w ON w.post_id = p.id
    WHERE 
      -- Only show approved posts
      p.status = 'approved'
      -- Exclude posts from blocked users
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks ub
        WHERE ub.blocker_id = p_user_id
        AND ub.blocked_id = p."user"
      )
      -- Exclude posts user has seen recently (2 hours)
      AND p.id NOT IN (
        SELECT i.post_id 
        FROM impressions i
        WHERE i.user_id = p_user_id 
        AND i.created_at > NOW() - INTERVAL '2 hours'
      )
    GROUP BY p.id, p.created_at, p.video_url, p.description, p."user", p.restaurant
  )
  SELECT 
    ps.id,
    ps.created_at,
    ps.video_url,
    ps.description,
    ps.user_id,
    ps.restaurant,
    ROUND(
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::NUMERIC / 
      POWER(ps.age_hours + 2, 1.5)::NUMERIC,
      4
    ) as score
  FROM post_stats ps
  ORDER BY 
    -- Seeded randomization weighted by score
    (0.5 - MOD((ps.id::NUMERIC * p_seed::NUMERIC), 1)) * (
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::NUMERIC / 
      POWER(ps.age_hours + 2, 1.5)::NUMERIC + 0.1
    ) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_user_blocked(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ranked_feed_with_moderation(UUID, INTEGER, INTEGER, FLOAT) TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check RLS is enabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('posts', 'comments', 'reports', 'user_blocks', 'moderators');

-- Check policies on posts:
-- SELECT * FROM pg_policies WHERE tablename = 'posts';

-- Check policies on comments:
-- SELECT * FROM pg_policies WHERE tablename = 'comments';

-- Check policies on reports:
-- SELECT * FROM pg_policies WHERE tablename = 'reports';

-- Test if moderator check works (replace with your user ID):
-- SELECT is_moderator('your-user-id-here'::UUID);

-- ============================================
-- NOTES:
-- ============================================
-- 1. To add your first moderator, manually insert:
--    INSERT INTO moderators (user_id) VALUES ('your-admin-user-id');
-- 2. The new feed function get_ranked_feed_with_moderation filters:
--    - Only approved posts
--    - Excludes blocked users
--    - Excludes recently seen posts
-- 3. Update your client to use get_ranked_feed_with_moderation instead of get_ranked_feed_offset

