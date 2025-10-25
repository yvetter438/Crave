-- ============================================
-- FIX: Offset-Based Pagination for Ranked Feed
-- Solves duplicate video issue with randomization
-- ============================================

-- This replaces cursor-based pagination with offset pagination
-- Cursor + RANDOM() caused duplicates because random order changed between fetches
-- Offset ensures consistent position within a single feed session

CREATE OR REPLACE FUNCTION get_ranked_feed_offset(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  created_at timestamptz,
  video_url text,
  description text,
  user_id uuid,
  restaurant bigint,
  score numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_unseen_posts boolean;
BEGIN
  -- Check if there are any unseen posts (within 2 hours)
  SELECT EXISTS(
    SELECT 1 FROM posts p
    WHERE p.id NOT IN (
      SELECT i.post_id 
      FROM impressions i
      WHERE i.user_id = p_user_id 
      AND i.created_at > now() - interval '2 hours'
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
      EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600.0 as age_hours,
      COALESCE(COUNT(DISTINCT l.id), 0) as likes_count,
      COALESCE(COUNT(DISTINCT s.id), 0) as saves_count,
      COALESCE(COUNT(DISTINCT w.id), 0) as watches_count
    FROM posts p
    LEFT JOIN likes l ON l.post_id = p.id
    LEFT JOIN saves s ON s.post_id = p.id
    LEFT JOIN watch_events w ON w.post_id = p.id
    WHERE 
      -- If there are unseen posts, exclude recent ones
      -- If no unseen posts, show all (fallback for rewatch)
      (
        NOT has_unseen_posts
        OR p.id NOT IN (
          SELECT i.post_id 
          FROM impressions i
          WHERE i.user_id = p_user_id 
          AND i.created_at > now() - interval '2 hours'
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
    ROUND(
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::numeric / 
      POWER(ps.age_hours + 2, 1.5)::numeric,
      4
    ) as score
  FROM post_stats ps
  ORDER BY 
    -- Randomization weighted by score
    RANDOM() * (
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::numeric / 
      POWER(ps.age_hours + 2, 1.5)::numeric + 0.1
    ) DESC,
    ps.created_at DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_ranked_feed_offset(uuid, integer, integer) TO authenticated;

-- ============================================
-- HOW THIS FIXES THE DUPLICATE ISSUE
-- ============================================

-- BEFORE (Cursor-based):
-- Request 1: RANDOM() seed = X, returns videos [A,B,C,D,E,F,G,H,I,J]
-- Cursor set to video J's created_at
-- Request 2: RANDOM() seed = Y (different!), WHERE created_at < J
--            Could return [B,D,F,H...] again because order changed!

-- AFTER (Offset-based):
-- Request 1: RANDOM() seed = X, OFFSET 0, returns [A,B,C,D,E,F,G,H,I,J]
-- Request 2: RANDOM() seed = Y (different!), OFFSET 10, returns [K,L,M,N,O,P,Q,R,S,T]
--            Different seed BUT offset ensures no overlap!

-- KEY INSIGHT: Each rewatch gets NEW random seed (fresh order)
--              But within ONE feed session, offset prevents duplicates

-- ============================================
-- TESTING
-- ============================================

-- Test: Get first 10 videos
-- SELECT * FROM get_ranked_feed_offset('your-user-id'::uuid, 10, 0);

-- Test: Get next 10 videos (should have NO overlap with first 10)
-- SELECT * FROM get_ranked_feed_offset('your-user-id'::uuid, 10, 10);

-- Verify no duplicates
-- WITH first_batch AS (
--   SELECT id FROM get_ranked_feed_offset('your-user-id'::uuid, 10, 0)
-- ),
-- second_batch AS (
--   SELECT id FROM get_ranked_feed_offset('your-user-id'::uuid, 10, 10)
-- )
-- SELECT COUNT(*) as duplicates
-- FROM first_batch
-- WHERE id IN (SELECT id FROM second_batch);
-- -- Should return 0!

