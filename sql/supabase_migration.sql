-- ============================================
-- Engagement Tracking + Ranked Feed Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CREATE IMPRESSIONS TABLE
-- Tracks when a user sees a post (app-level deduplication via impressionLoggedRef)
CREATE TABLE IF NOT EXISTS impressions (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id bigint REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impressions_user_post ON impressions(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_impressions_created_at ON impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_impressions_user_created ON impressions(user_id, created_at);

-- 2. CREATE WATCH_EVENTS TABLE
-- Tracks video watch duration (only ≥2 seconds)
CREATE TABLE IF NOT EXISTS watch_events (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id bigint REFERENCES posts(id) ON DELETE CASCADE,
  watch_duration_seconds integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (watch_duration_seconds >= 2)
);

CREATE INDEX IF NOT EXISTS idx_watch_events_post ON watch_events(post_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_user ON watch_events(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_created ON watch_events(created_at);

-- 3. ADD RLS POLICIES
-- Allow users to insert their own engagement data
ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own impressions"
  ON impressions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own impressions"
  ON impressions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch events"
  ON watch_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own watch events"
  ON watch_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. CREATE RANKED FEED RPC FUNCTION
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
    -- Add randomization weighted by score for variety
    RANDOM() * (
      (ps.likes_count * 2 + ps.saves_count * 3 + ps.watches_count)::numeric / 
      POWER(ps.age_hours + 2, 1.5)::numeric + 0.1
    ) DESC,
    ps.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 5. GRANT EXECUTE PERMISSION
GRANT EXECUTE ON FUNCTION get_ranked_feed(uuid, integer, timestamptz) TO authenticated;

-- ============================================
-- OPTIONAL: Create helper function to log impression
-- ============================================
CREATE OR REPLACE FUNCTION log_impression(
  p_user_id uuid,
  p_post_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO impressions (user_id, post_id)
  VALUES (p_user_id, p_post_id);
END;
$$;

GRANT EXECUTE ON FUNCTION log_impression(uuid, bigint) TO authenticated;

-- ============================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================
-- Check tables created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('impressions', 'watch_events');

-- Check RPC function exists:
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_ranked_feed';

-- Test the feed (replace with real user_id):
-- SELECT * FROM get_ranked_feed('your-user-id-here'::uuid, 10, NULL);

