-- Add columns for content removal tracking
-- Run this migration to support the moderation system

-- Add removed_at and removed_reason columns to posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS removed_reason TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_removed_at ON posts(removed_at) WHERE removed_at IS NOT NULL;

-- Add yourself as a moderator
-- Replace 'YOUR_USER_ID' with your actual Supabase auth user ID
-- You can find your user ID by running: SELECT id FROM auth.users WHERE email = 'your@email.com';

-- Example:
-- INSERT INTO moderators (user_id, granted_by)
-- VALUES ('cdc73b26-3030-42aa-9745-3e9254add7bf', 'cdc73b26-3030-42aa-9745-3e9254add7bf')
-- ON CONFLICT (user_id) DO NOTHING;

-- To add yourself, first find your user ID:
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- Then run this (replace YOUR_USER_ID with the ID from above):
-- INSERT INTO moderators (user_id, granted_by)
-- VALUES ('YOUR_USER_ID', 'YOUR_USER_ID')
-- ON CONFLICT (user_id) DO NOTHING;

-- Verify you're added:
SELECT 
  m.id,
  m.user_id,
  au.email,
  m.granted_at
FROM moderators m
JOIN auth.users au ON m.user_id = au.id;

