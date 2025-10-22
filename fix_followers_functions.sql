-- ============================================
-- FIX: Followers/Following Functions Type Mismatch
-- Run this to fix the data type mismatch error
-- ============================================

-- Drop existing functions
DROP FUNCTION IF EXISTS get_followers(uuid, integer, integer);
DROP FUNCTION IF EXISTS get_following(uuid, integer, integer);

-- Recreate get_followers with correct return types
CREATE OR REPLACE FUNCTION get_followers(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  username character varying,
  displayname text,
  avatar_url text,
  followers_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.displayname,
    p.avatar_url,
    p.followers_count,
    f.created_at
  FROM followers f
  JOIN profiles p ON p.user_id = f.follower_id
  WHERE f.following_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recreate get_following with correct return types
CREATE OR REPLACE FUNCTION get_following(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  username character varying,
  displayname text,
  avatar_url text,
  followers_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.displayname,
    p.avatar_url,
    p.followers_count,
    f.created_at
  FROM followers f
  JOIN profiles p ON p.user_id = f.following_id
  WHERE f.follower_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_followers(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_following(uuid, integer, integer) TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Test the functions (replace with real user_id)
-- SELECT * FROM get_followers('your-user-id'::uuid, 10, 0);
-- SELECT * FROM get_following('your-user-id'::uuid, 10, 0);

-- Check function exists
SELECT 
  routine_name, 
  data_type 
FROM information_schema.routines 
WHERE routine_name IN ('get_followers', 'get_following')
  AND routine_schema = 'public';

