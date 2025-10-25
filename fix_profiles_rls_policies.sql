-- ============================================
-- FIX PROFILES TABLE RLS POLICIES
-- This adds the missing RLS policies for profiles table
-- ============================================

-- 1. First, let's check what RLS policies exist on profiles table
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

-- 2. Add missing RLS policies for profiles table
-- Allow everyone to view profiles (needed for comment display)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Verify the policies were added
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

-- 4. Test the comment query that was failing
-- This should now work with proper RLS policies
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
WHERE c.post_id = 54  -- Using one of your actual post IDs
    AND c.status = 'visible'
    AND c.parent_comment_id IS NULL
ORDER BY c.created_at DESC
LIMIT 10;

-- 5. Test a simpler query to make sure the join works
SELECT 
    c.id,
    c.text,
    p.username
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.user_id
LIMIT 3;
