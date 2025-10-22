-- ============================================
-- PROFILE ENHANCEMENTS MIGRATION
-- Adds social features: bio, location, Instagram, follower counts
-- ============================================

-- 1. ADD NEW COLUMNS TO PROFILES TABLE
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- 2. ADD CONSTRAINTS
ALTER TABLE profiles
  ADD CONSTRAINT bio_length_check CHECK (char_length(bio) <= 500),
  ADD CONSTRAINT location_length_check CHECK (char_length(location) <= 100),
  ADD CONSTRAINT instagram_handle_length_check CHECK (char_length(instagram_handle) <= 30);

-- 3. ADD INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_instagram_handle ON profiles(instagram_handle);

-- 4. CREATE FOLLOWERS TABLE (for many-to-many relationships)
CREATE TABLE IF NOT EXISTS followers (
  id bigserial PRIMARY KEY,
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Add indexes for followers queries
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created ON followers(created_at);

-- 5. ENABLE RLS ON FOLLOWERS TABLE
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Anyone can view followers
CREATE POLICY "Anyone can view followers"
  ON followers FOR SELECT
  TO authenticated
  USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON followers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON followers FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- 6. CREATE FUNCTION TO UPDATE FOLLOWER COUNTS
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following_count for follower
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE user_id = NEW.follower_id;
    
    -- Increment followers_count for the user being followed
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE user_id = NEW.following_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following_count for follower
    UPDATE profiles
    SET following_count = following_count - 1
    WHERE user_id = OLD.follower_id;
    
    -- Decrement followers_count for the user being unfollowed
    UPDATE profiles
    SET followers_count = followers_count - 1
    WHERE user_id = OLD.following_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREATE TRIGGER FOR FOLLOWER COUNTS
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON followers;
CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

-- 8. CREATE FUNCTION TO UPDATE LIKES COUNT
CREATE OR REPLACE FUNCTION update_user_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the owner of the post
    SELECT "user" INTO post_owner_id
    FROM posts
    WHERE id = NEW.post_id;
    
    -- Increment likes_count for the post owner
    UPDATE profiles
    SET likes_count = likes_count + 1
    WHERE user_id = post_owner_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Get the owner of the post
    SELECT "user" INTO post_owner_id
    FROM posts
    WHERE id = OLD.post_id;
    
    -- Decrement likes_count for the post owner
    UPDATE profiles
    SET likes_count = likes_count - 1
    WHERE user_id = post_owner_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CREATE TRIGGER FOR LIKES COUNT
DROP TRIGGER IF EXISTS trigger_update_user_likes_count ON likes;
CREATE TRIGGER trigger_update_user_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_likes_count();

-- 10. FUNCTION TO GET USER PROFILE (with all social data)
CREATE OR REPLACE FUNCTION get_user_profile(p_username text)
RETURNS TABLE (
  id bigint,
  user_id uuid,
  username text,
  displayname text,
  avatar_url text,
  bio text,
  location text,
  instagram_handle text,
  followers_count integer,
  following_count integer,
  likes_count integer,
  post_count bigint,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.displayname,
    p.avatar_url,
    p.bio,
    p.location,
    p.instagram_handle,
    p.followers_count,
    p.following_count,
    p.likes_count,
    COUNT(DISTINCT posts.id) as post_count,
    p.created_at
  FROM profiles p
  LEFT JOIN posts ON posts."user" = p.user_id
  WHERE p.username = p_username
  GROUP BY p.id, p.user_id, p.username, p.displayname, p.avatar_url, 
           p.bio, p.location, p.instagram_handle, p.followers_count, 
           p.following_count, p.likes_count, p.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_profile(text) TO authenticated;

-- 11. FUNCTION TO CHECK IF USER IS FOLLOWING ANOTHER USER
CREATE OR REPLACE FUNCTION is_following(
  p_follower_id uuid,
  p_following_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM followers
    WHERE follower_id = p_follower_id
      AND following_id = p_following_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_following(uuid, uuid) TO authenticated;

-- 12. FUNCTION TO GET FOLLOWERS LIST
CREATE OR REPLACE FUNCTION get_followers(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  username text,
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

GRANT EXECUTE ON FUNCTION get_followers(uuid, integer, integer) TO authenticated;

-- 13. FUNCTION TO GET FOLLOWING LIST
CREATE OR REPLACE FUNCTION get_following(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  username text,
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

GRANT EXECUTE ON FUNCTION get_following(uuid, integer, integer) TO authenticated;

-- 14. INITIALIZE EXISTING LIKES COUNTS (one-time data migration)
-- This updates likes_count for all existing users based on their current likes
UPDATE profiles p
SET likes_count = (
  SELECT COUNT(*)
  FROM likes l
  JOIN posts po ON po.id = l.post_id
  WHERE po."user" = p.user_id
)
WHERE p.likes_count = 0;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check new columns exist
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;

-- Check followers table created
-- SELECT * FROM followers LIMIT 5;

-- Test get_user_profile function
-- SELECT * FROM get_user_profile('your-username-here');

-- Check likes counts were initialized
-- SELECT username, likes_count FROM profiles WHERE likes_count > 0;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To rollback this migration:
-- DROP TRIGGER IF EXISTS trigger_update_follower_counts ON followers;
-- DROP TRIGGER IF EXISTS trigger_update_user_likes_count ON likes;
-- DROP FUNCTION IF EXISTS update_follower_counts();
-- DROP FUNCTION IF EXISTS update_user_likes_count();
-- DROP FUNCTION IF EXISTS get_user_profile(text);
-- DROP FUNCTION IF EXISTS is_following(uuid, uuid);
-- DROP FUNCTION IF EXISTS get_followers(uuid, integer, integer);
-- DROP FUNCTION IF EXISTS get_following(uuid, integer, integer);
-- DROP TABLE IF EXISTS followers;
-- ALTER TABLE profiles
--   DROP COLUMN IF EXISTS bio,
--   DROP COLUMN IF EXISTS location,
--   DROP COLUMN IF EXISTS instagram_handle,
--   DROP COLUMN IF EXISTS followers_count,
--   DROP COLUMN IF EXISTS following_count,
--   DROP COLUMN IF EXISTS likes_count;

