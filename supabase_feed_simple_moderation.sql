-- ============================================
-- SIMPLIFIED MODERATION FEED (Works like old feed)
-- This uses the original algorithm but adds moderation filters
-- ============================================

-- Drop the complex function and replace with simpler version
DROP FUNCTION IF EXISTS get_ranked_feed_with_moderation(UUID, INTEGER, INTEGER, FLOAT);

CREATE OR REPLACE FUNCTION get_ranked_feed_with_moderation(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_seed FLOAT DEFAULT 0.5  -- Not used, kept for compatibility
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
DECLARE
  has_unseen_posts BOOLEAN;
BEGIN
  -- Check if there are any unseen approved posts (within 2 hours)
  SELECT EXISTS(
    SELECT 1 FROM posts p
    WHERE p.status = 'approved'  -- Only approved posts
    AND p.id NOT IN (
      SELECT i.post_id 
      FROM impressions i
      WHERE i.user_id = p_user_id 
      AND i.created_at > NOW() - INTERVAL '2 hours'
    )
    -- Exclude blocked users
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      WHERE ub.blocker_id = p_user_id
      AND ub.blocked_id = p."user"
    )
  ) INTO has_unseen_posts;

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
      -- If there are unseen posts, exclude recently seen ones
      -- If no unseen posts, show all (fallback for rewatch)
      AND (
        NOT has_unseen_posts
        OR p.id NOT IN (
          SELECT i.post_id 
          FROM impressions i
          WHERE i.user_id = p_user_id 
          AND i.created_at > NOW() - INTERVAL '2 hours'
        )
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
    -- Ranking formula: popularity / age decay (same as original)
    ROUND(
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::NUMERIC / 
      POWER(ps.age_hours + 2, 1.5)::NUMERIC,
      4
    ) as score
  FROM post_stats ps
  ORDER BY 
    -- Simple weighted randomization (more consistent than seeded)
    RANDOM() * (
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::NUMERIC / 
      POWER(ps.age_hours + 2, 1.5)::NUMERIC + 0.1
    ) DESC,
    ps.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_ranked_feed_with_moderation(UUID, INTEGER, INTEGER, FLOAT) TO authenticated;

-- ============================================
-- WHAT'S DIFFERENT FROM THE COMPLEX VERSION:
-- ============================================
-- 1. Removed seeded randomization (caused duplicates)
-- 2. Uses simple RANDOM() like the original
-- 3. More consistent pagination
-- 4. Same performance characteristics as before
-- 5. Still includes all moderation filters:
--    - Only approved posts
--    - Filters blocked users  
--    - Filters recently seen posts

-- ============================================
-- TO APPLY:
-- ============================================
-- Run this in Supabase SQL Editor
-- It will replace the complex function with this simpler one
-- No client-side changes needed!

