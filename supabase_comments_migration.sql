-- ============================================
-- COMMENTS FEATURE MIGRATION
-- ============================================

-- 1. Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for better performance
  CONSTRAINT text_not_empty CHECK (length(trim(text)) > 0)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 2. Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate likes
  UNIQUE(comment_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- 3. Add comments_count column to posts table (for denormalization/performance)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 4. Create function to update comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only count top-level comments (not replies)
    IF NEW.parent_comment_id IS NULL THEN
      UPDATE posts 
      SET comments_count = comments_count + 1 
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Only count top-level comments (not replies)
    IF OLD.parent_comment_id IS NULL THEN
      UPDATE posts 
      SET comments_count = GREATEST(0, comments_count - 1)
      WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for comments count
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for comments

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Anyone can read comments
CREATE POLICY "Comments are viewable by everyone" 
  ON comments FOR SELECT 
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" 
  ON comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" 
  ON comments FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
  ON comments FOR DELETE 
  USING (auth.uid() = user_id);

-- 8. RLS Policies for comment_likes

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete their own comment likes" ON comment_likes;

-- Anyone can read comment likes
CREATE POLICY "Comment likes are viewable by everyone" 
  ON comment_likes FOR SELECT 
  USING (true);

-- Authenticated users can like comments
CREATE POLICY "Authenticated users can like comments" 
  ON comment_likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comment likes
CREATE POLICY "Users can delete their own comment likes" 
  ON comment_likes FOR DELETE 
  USING (auth.uid() = user_id);

-- 9. Function to get comment with metadata (likes count, reply count, user info)
CREATE OR REPLACE FUNCTION get_comments_with_metadata(p_post_id BIGINT, p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id BIGINT,
  post_id BIGINT,
  user_id UUID,
  parent_comment_id BIGINT,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  username TEXT,
  displayname TEXT,
  avatar_url TEXT,
  likes_count BIGINT,
  replies_count BIGINT,
  is_liked_by_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.parent_comment_id,
    c.text,
    c.created_at,
    p.username::TEXT,
    p.displayname::TEXT,
    p.avatar_url::TEXT,
    COALESCE(cl.likes_count, 0) AS likes_count,
    COALESCE(rc.replies_count, 0) AS replies_count,
    CASE 
      WHEN p_user_id IS NOT NULL THEN EXISTS(
        SELECT 1 FROM comment_likes 
        WHERE comment_id = c.id AND comment_likes.user_id = p_user_id
      )
      ELSE false
    END AS is_liked_by_user
  FROM comments c
  LEFT JOIN profiles p ON c.user_id = p.user_id
  LEFT JOIN (
    SELECT comment_id, COUNT(*) as likes_count
    FROM comment_likes
    GROUP BY comment_id
  ) cl ON c.id = cl.comment_id
  LEFT JOIN (
    SELECT c2.parent_comment_id, COUNT(*) as replies_count
    FROM comments c2
    WHERE c2.parent_comment_id IS NOT NULL
    GROUP BY c2.parent_comment_id
  ) rc ON c.id = rc.parent_comment_id
  WHERE c.post_id = p_post_id
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to get replies for a specific comment
CREATE OR REPLACE FUNCTION get_comment_replies(p_comment_id BIGINT, p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id BIGINT,
  post_id BIGINT,
  user_id UUID,
  parent_comment_id BIGINT,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  username TEXT,
  displayname TEXT,
  avatar_url TEXT,
  likes_count BIGINT,
  is_liked_by_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.parent_comment_id,
    c.text,
    c.created_at,
    p.username::TEXT,
    p.displayname::TEXT,
    p.avatar_url::TEXT,
    COALESCE(cl.likes_count, 0) AS likes_count,
    CASE 
      WHEN p_user_id IS NOT NULL THEN EXISTS(
        SELECT 1 FROM comment_likes 
        WHERE comment_id = c.id AND comment_likes.user_id = p_user_id
      )
      ELSE false
    END AS is_liked_by_user
  FROM comments c
  LEFT JOIN profiles p ON c.user_id = p.user_id
  LEFT JOIN (
    SELECT comment_id, COUNT(*) as likes_count
    FROM comment_likes
    GROUP BY comment_id
  ) cl ON c.id = cl.comment_id
  WHERE c.parent_comment_id = p_comment_id
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('comments', 'comment_likes');

-- Check RLS policies
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('comments', 'comment_likes');

-- Test the function
-- SELECT * FROM get_comments_with_metadata(1, 'your-user-id-here');

