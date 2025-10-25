-- ============================================
-- FINAL FIX: Seeded Random Pagination
-- Ensures consistent order within a feed session
-- ============================================

-- Drop the broken offset function
DROP FUNCTION IF EXISTS get_ranked_feed_offset(uuid, integer, integer);

-- Create new version with seed parameter
CREATE OR REPLACE FUNCTION get_ranked_feed_offset(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0,
  p_seed double precision DEFAULT NULL
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
  actual_seed double precision;
BEGIN
  -- Use provided seed or generate one from user_id + current hour
  -- This makes seed consistent for ~1 hour, then changes
  IF p_seed IS NOT NULL THEN
    actual_seed := p_seed;
  ELSE
    actual_seed := (EXTRACT(EPOCH FROM now()) / 3600)::integer + 
                   (('x' || substring(p_user_id::text, 1, 8))::bit(32)::int / 1000000000.0);
  END IF;
  
  -- Set the seed for this query
  PERFORM setseed(actual_seed - floor(actual_seed)); -- Ensure 0 <= seed < 1

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
      COALESCE(COUNT(DISTINCT w.id), 0) as watches_count,
      -- Use RANDOM() which now uses our seed
      RANDOM() as random_val
    FROM posts p
    LEFT JOIN likes l ON l.post_id = p.id
    LEFT JOIN saves s ON s.post_id = p.id
    LEFT JOIN watch_events w ON w.post_id = p.id
    WHERE 
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
    -- Order by the random value (which uses our seed)
    ps.random_val * (
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::numeric / 
      POWER(ps.age_hours + 2, 1.5)::numeric + 0.1
    ) DESC,
    ps.id ASC  -- Tie-breaker for consistency
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_ranked_feed_offset(uuid, integer, integer, double precision) TO authenticated;

-- ============================================
-- HOW THIS WORKS
-- ============================================

-- The seed is based on: user_id hash + current_hour
-- This means:
-- - Same seed for all fetches in same hour = consistent order
-- - Different seed each hour = feed refreshes naturally
-- - Different seed on rewatch (user explicitly refreshes) = new order

-- Example:
-- User opens app at 2:30 PM
-- Fetch 1 (offset 0):  seed=123.456 → Order: [A,B,C,D,E,F,G,H,I,J]
-- Fetch 2 (offset 10): seed=123.456 → Order: [A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T]
--                                             Returns K-T (no duplicates!)
-- User clicks rewatch: generates new seed → completely new order

