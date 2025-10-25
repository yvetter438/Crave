-- ============================================
-- SIMPLE COMMENTS TABLE CHECK
-- Run this to understand your comments table structure
-- ============================================

-- 1. CHECK IF COMMENTS TABLE EXISTS
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'comments' AND table_schema = 'public'
    ) THEN 'comments table EXISTS' ELSE 'comments table MISSING' END as comments_table_check;

-- 2. GET COMMENTS TABLE STRUCTURE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. CHECK IF PROFILES TABLE EXISTS
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) THEN 'profiles table EXISTS' ELSE 'profiles table MISSING' END as profiles_table_check;

-- 4. GET PROFILES TABLE STRUCTURE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. CHECK IF COMMENT_LIKES TABLE EXISTS
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'comment_likes' AND table_schema = 'public'
    ) THEN 'comment_likes table EXISTS' ELSE 'comment_likes table MISSING' END as comment_likes_check;

-- 6. SAMPLE COMMENTS DATA (if table exists)
SELECT 
    id,
    post_id,
    user_id,
    text,
    created_at
FROM comments 
LIMIT 3;

-- 7. CHECK FOREIGN KEYS ON COMMENTS TABLE
SELECT 
    tc.constraint_name,
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
AND tc.table_name = 'comments';
