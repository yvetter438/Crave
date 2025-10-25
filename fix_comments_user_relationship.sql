-- ============================================
-- FIX COMMENTS USER RELATIONSHIP
-- This adds the missing foreign key relationship between comments and users
-- ============================================

-- 1. First, let's check the current structure of comments table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if user_id column exists and what type it is
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'user_id'
    ) THEN 'user_id column EXISTS' ELSE 'user_id column MISSING' END as user_id_check;

-- 3. Add the missing foreign key constraint
-- This creates the relationship between comments.user_id and auth.users.id
ALTER TABLE comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Verify the foreign key was added
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
AND tc.table_name = 'comments'
ORDER BY tc.constraint_name;

-- 5. Test the relationship by trying to join comments with profiles
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
