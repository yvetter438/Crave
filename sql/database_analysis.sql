-- ============================================
-- DATABASE STRUCTURE ANALYSIS
-- Run these queries to understand your current Supabase setup
-- ============================================

-- 1. CHECK COMMENTS TABLE STRUCTURE
-- This will show us the exact columns and data types in your comments table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. CHECK PROFILES TABLE STRUCTURE  
-- This will show us the profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. CHECK FOREIGN KEY RELATIONSHIPS
-- This will show us what foreign keys exist between tables
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND (tc.table_name = 'comments' OR tc.table_name = 'profiles')
ORDER BY tc.table_name, kcu.column_name;

-- 4. CHECK COMMENTS TABLE INDEXES
-- This will show us what indexes exist on the comments table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'comments' 
AND schemaname = 'public';

-- 5. SAMPLE COMMENTS DATA STRUCTURE
-- This will show us what actual data looks like in comments
SELECT 
    id,
    post_id,
    user_id,
    parent_comment_id,
    text,
    created_at,
    status
FROM comments 
LIMIT 5;

-- 6. CHECK IF COMMENTS HAVE PROPER USER RELATIONSHIPS
-- This will show us if comments can properly join with user data
SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.text,
    c.created_at,
    p.username,
    p.displayname
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.user_id
LIMIT 5;

-- 7. CHECK POSTS TABLE STRUCTURE
-- This will show us the posts table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. CHECK ROW LEVEL SECURITY POLICIES
-- This will show us what RLS policies exist for comments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'comments'
AND schemaname = 'public';

-- 9. CHECK COMMENT_LIKES TABLE (if it exists)
-- This will show us if there's a comment likes table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'comment_likes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. CHECK AUTH.USERS TABLE STRUCTURE
-- This will show us the auth.users table structure (for user_id references)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;
