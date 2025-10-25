-- ============================================
-- CHECK RLS POLICIES FOR COMMENTS
-- This will identify RLS issues that might be blocking comment queries
-- ============================================

-- 1. CHECK IF RLS IS ENABLED ON COMMENTS TABLE
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'comments';

-- 2. CHECK ALL RLS POLICIES ON COMMENTS TABLE
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'comments'
AND schemaname = 'public'
ORDER BY policyname;

-- 3. CHECK RLS POLICIES ON PROFILES TABLE
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
AND schemaname = 'public'
ORDER BY policyname;

-- 4. CHECK RLS POLICIES ON COMMENT_LIKES TABLE
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'comment_likes'
AND schemaname = 'public'
ORDER BY policyname;

-- 5. TEST COMMENT QUERY WITH CURRENT USER CONTEXT
-- This simulates what your app is trying to do
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
    p.avatar_url
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.user_id
WHERE c.post_id = 1  -- Replace with actual post ID
    AND c.status = 'visible'
    AND c.parent_comment_id IS NULL
ORDER BY c.created_at DESC
LIMIT 10;

-- 6. CHECK IF THERE ARE ANY COMMENTS IN THE TABLE
SELECT 
    COUNT(*) as total_comments,
    COUNT(CASE WHEN status = 'visible' THEN 1 END) as visible_comments,
    COUNT(CASE WHEN status = 'removed' THEN 1 END) as removed_comments
FROM comments;

-- 7. CHECK SAMPLE COMMENT DATA
SELECT 
    id,
    post_id,
    user_id,
    text,
    status,
    created_at
FROM comments 
ORDER BY created_at DESC
LIMIT 5;

-- 8. CHECK IF USER_ID COLUMN HAS PROPER VALUES
SELECT 
    COUNT(*) as total_comments,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_ids,
    COUNT(DISTINCT user_id) as unique_users
FROM comments;
