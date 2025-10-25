-- ============================================
-- COMMENT SYSTEM DIAGNOSTIC QUERIES
-- Run these to identify the specific comment fetching issues
-- ============================================

-- 1. TEST THE EXACT QUERY THAT'S FAILING
-- This simulates what your CommentSheet.tsx is trying to do
SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.parent_comment_id,
    c.text,
    c.created_at,
    c.status,
    p.username,
    p.displayname,
    p.avatar_url,
    COALESCE(cl.likes_count, 0) as likes_count,
    COALESCE(cr.replies_count, 0) as replies_count,
    CASE WHEN user_likes.id IS NOT NULL THEN true ELSE false END as is_liked_by_user
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.user_id
LEFT JOIN (
    SELECT comment_id, COUNT(*) as likes_count
    FROM comment_likes
    GROUP BY comment_id
) cl ON c.id = cl.comment_id
LEFT JOIN (
    SELECT parent_comment_id, COUNT(*) as replies_count
    FROM comments
    WHERE parent_comment_id IS NOT NULL
    GROUP BY parent_comment_id
) cr ON c.id = cr.parent_comment_id
LEFT JOIN comment_likes user_likes ON c.id = user_likes.comment_id 
    AND user_likes.user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user ID
WHERE c.post_id = 1 -- Replace with actual post ID
    AND c.status = 'visible'
    AND c.parent_comment_id IS NULL
ORDER BY c.created_at DESC;

-- 2. CHECK IF COMMENTS TABLE HAS THE RIGHT COLUMNS
-- This will tell us if the comments table has all the columns we expect
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'user_id'
    ) THEN 'user_id exists' ELSE 'user_id MISSING' END as user_id_check,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'post_id'
    ) THEN 'post_id exists' ELSE 'post_id MISSING' END as post_id_check,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'text'
    ) THEN 'text exists' ELSE 'text MISSING' END as text_check,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'status'
    ) THEN 'status exists' ELSE 'status MISSING' END as status_check;

-- 3. CHECK IF PROFILES TABLE HAS THE RIGHT COLUMNS
-- This will tell us if the profiles table has all the columns we expect
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
    ) THEN 'user_id exists' ELSE 'user_id MISSING' END as user_id_check,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN 'username exists' ELSE 'username MISSING' END as username_check,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'displayname'
    ) THEN 'displayname exists' ELSE 'displayname MISSING' END as displayname_check;

-- 4. CHECK IF COMMENT_LIKES TABLE EXISTS
-- This will tell us if the comment_likes table exists
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'comment_likes' AND table_schema = 'public'
    ) THEN 'comment_likes table EXISTS' ELSE 'comment_likes table MISSING' END as comment_likes_check;

-- 5. CHECK FOREIGN KEY CONSTRAINTS
-- This will show us what foreign key constraints exist
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND (tc.table_name = 'comments' OR tc.table_name = 'comment_likes')
ORDER BY tc.table_name, kcu.column_name;

-- 6. CHECK ROW LEVEL SECURITY ON COMMENTS
-- This will show us if RLS is enabled and what policies exist
SELECT 
    pg_tables.tablename,
    pg_tables.rowsecurity as rls_enabled,
    COUNT(pg_policies.policyname) as policy_count
FROM pg_tables 
LEFT JOIN pg_policies ON pg_tables.tablename = pg_policies.tablename
WHERE pg_tables.schemaname = 'public' 
AND pg_tables.tablename = 'comments'
GROUP BY pg_tables.tablename, pg_tables.rowsecurity;

-- 7. TEST SIMPLE COMMENT FETCH
-- This is a simplified version of the comment fetch to test basic functionality
SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.text,
    c.created_at
FROM comments c
WHERE c.post_id = 1 -- Replace with actual post ID
ORDER BY c.created_at DESC
LIMIT 10;
