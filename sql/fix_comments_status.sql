-- ============================================
-- FIX: Comments Status Column
-- Run this in Supabase SQL Editor
-- ============================================

-- Check if status column exists
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE comments ADD COLUMN status text DEFAULT 'visible';
        RAISE NOTICE 'Added status column to comments table';
    ELSE
        RAISE NOTICE 'Status column already exists in comments table';
    END IF;
END $$;

-- Update all existing comments to have 'visible' status
UPDATE comments 
SET status = 'visible' 
WHERE status IS NULL;

-- Check the result
SELECT 
    status,
    COUNT(*) as count
FROM comments 
GROUP BY status;

-- Test comment fetching for a specific post
-- Replace 1 with an actual post ID from your database
SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.text,
    c.status,
    c.created_at,
    p.username,
    p.displayname
FROM comments c
JOIN profiles p ON p.user_id = c.user_id
WHERE c.post_id = 1  -- Replace with actual post ID
ORDER BY c.created_at ASC;

RAISE NOTICE '✅ Comments status column fixed and tested';
