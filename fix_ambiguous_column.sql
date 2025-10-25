-- ============================================
-- FIX: Ambiguous column reference in functions
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop and recreate get_comments_with_moderation with fixed column references
DROP FUNCTION IF EXISTS get_comments_with_moderation(bigint, uuid) CASCADE;

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
      SELECT 1 FROM comment_likes cl2
      WHERE cl2.comment_id = c.id 
      AND cl2.user_id = p_user_id
    ) as is_liked_by_user
  FROM comments c
  INNER JOIN profiles p ON p.user_id = c.user_id
  LEFT JOIN comment_likes cl ON cl.comment_id = c.id
  LEFT JOIN comments replies ON replies.parent_comment_id = c.id
  WHERE 
    c.post_id = p_post_id
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

GRANT EXECUTE ON FUNCTION get_comments_with_moderation(bigint, uuid) TO authenticated;

-- Drop and recreate get_comment_replies_with_moderation with fixed column references
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
      SELECT 1 FROM comment_likes cl2
      WHERE cl2.comment_id = c.id 
      AND cl2.user_id = p_user_id
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

-- Update get_comments_with_metadata to use the fixed function
DROP FUNCTION IF EXISTS get_comments_with_metadata(bigint, uuid) CASCADE;

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

RAISE NOTICE '✅ Fixed ambiguous column references in comment functions';
