-- ============================================
-- FIX COMMENT COUNTER TO INCLUDE REPLIES
-- This updates the trigger to count ALL comments (top-level + replies)
-- ============================================

-- 1. Update the function to count ALL comments, not just top-level
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Count ALL comments (both top-level and replies)
    UPDATE posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Count ALL comments (both top-level and replies)
    UPDATE posts 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Recreate the trigger (this will use the updated function)
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- 3. Fix existing comment counts by recalculating them
-- This will update all posts to have the correct total comment count
UPDATE posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM comments 
  WHERE comments.post_id = posts.id 
  AND comments.status = 'visible'
)
WHERE id IN (
  SELECT DISTINCT post_id 
  FROM comments 
  WHERE status = 'visible'
);

-- 4. Verify the fix by checking a few posts
-- Run this to see if the counts are now correct
SELECT 
  p.id as post_id,
  p.comments_count as stored_count,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'visible') as actual_count,
  CASE 
    WHEN p.comments_count = (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'visible') 
    THEN '✅ CORRECT' 
    ELSE '❌ MISMATCH' 
  END as status
FROM posts p
WHERE p.id IN (
  SELECT DISTINCT post_id 
  FROM comments 
  WHERE status = 'visible'
)
ORDER BY p.id
LIMIT 10;
