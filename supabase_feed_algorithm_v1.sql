-- ============================================
-- CRAVE FEED ALGORITHM V1
-- Last Updated: Implementation of 2-hour window + fallback
-- ============================================

-- OVERVIEW:
-- This function returns a ranked feed of posts for a user.
-- - Excludes videos seen in past 2 hours (short window for "hungry now" use case)
-- - Falls back to showing ALL videos if none are unseen (enables rewatch)
-- - Randomizes order weighted by engagement score (variety on each view)
-- - Designed for MVP with limited videos in single neighborhood

-- KNOWN LIMITATIONS:
-- 1. Edge case: If user partially watches feed, some videos may cycle faster
-- 2. No geographic filtering yet (assumes all content is local)
-- 3. Randomization means lower-scored videos can appear before high-scored ones
-- 4. 2-hour window may feel short for users who browse multiple times per day

-- WHY THESE CHOICES FOR MVP:
-- - 2 hours: Allows lunch + dinner rewatch same day
-- - Fallback: Never empty feed, always can rewatch
-- - Random: Makes 20 videos feel like more content
-- - Simple: Easy to understand and debug

CREATE OR REPLACE FUNCTION get_ranked_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
  p_cursor timestamptz DEFAULT NULL
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
      -- Calculate age in hours
      EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600.0 as age_hours,
      -- Count engagement metrics
      COALESCE(COUNT(DISTINCT l.id), 0) as likes_count,
      COALESCE(COUNT(DISTINCT s.id), 0) as saves_count,
      COALESCE(COUNT(DISTINCT w.id), 0) as watches_count
    FROM posts p
    LEFT JOIN likes l ON l.post_id = p.id
    LEFT JOIN saves s ON s.post_id = p.id
    LEFT JOIN watch_events w ON w.post_id = p.id
    WHERE 
      -- CORE LOGIC: If there are unseen posts, exclude recent ones
      --             If no unseen posts, show all (fallback for rewatch)
      (
        NOT has_unseen_posts
        OR p.id NOT IN (
          SELECT i.post_id 
          FROM impressions i
          WHERE i.user_id = p_user_id 
          AND i.created_at > now() - interval '2 hours'
        )
      )
      -- Cursor pagination
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
    GROUP BY p.id, p.created_at, p.video_url, p.description, p."user", p.restaurant
  )
  SELECT 
    ps.id,
    ps.created_at,
    ps.video_url,
    ps.description,
    ps.user_id,
    ps.restaurant,
    -- Ranking formula: popularity / age decay
    -- Formula: (likes*2 + saves*3 + watches) / (age_hours + 2)^1.5
    ROUND(
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::numeric / 
      POWER(ps.age_hours + 2, 1.5)::numeric,
      4
    ) as score
  FROM post_stats ps
  ORDER BY 
    -- RANDOMIZATION: Weighted by score for variety
    -- Higher-scored videos more likely to appear early, but not guaranteed
    RANDOM() * (
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::numeric / 
      POWER(ps.age_hours + 2, 1.5)::numeric + 0.1
    ) DESC,
    ps.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_ranked_feed(uuid, integer, timestamptz) TO authenticated;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- Test 1: Get feed for user (replace with real user_id)
-- SELECT * FROM get_ranked_feed('user-id-here'::uuid, 10, NULL);

-- Test 2: Check impressions for user
-- SELECT post_id, created_at, now() - created_at as age 
-- FROM impressions 
-- WHERE user_id = auth.uid() 
-- ORDER BY created_at DESC;

-- Test 3: Clear impressions for testing (use carefully!)
-- DELETE FROM impressions WHERE user_id = auth.uid();

-- ============================================
-- FUTURE IMPROVEMENTS (Post-MVP)
-- ============================================

-- Phase 2: Geographic filtering
--   WHERE ST_DWithin(restaurant_location, user_location, radius)

-- Phase 3: Personalization by cuisine preference
--   score * (CASE WHEN user_likes_cuisine THEN 1.5 ELSE 1.0 END)

-- Phase 4: Time-based boosting
--   Boost breakfast content 7-11am, dinner content 5-9pm

-- Phase 5: Collaborative filtering
--   "Users who liked X also liked Y"

