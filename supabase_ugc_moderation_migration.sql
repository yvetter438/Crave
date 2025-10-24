-- ============================================
-- UGC MODERATION MIGRATION
-- Apple App Store Compliance for User-Generated Content
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: UPDATE POSTS TABLE
-- ============================================

-- Add status column to posts table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE posts ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed'));
    
    -- Update existing posts to 'approved' status (grandfather existing content)
    UPDATE posts SET status = 'approved' WHERE status IS NULL;
    
    -- Make status NOT NULL after setting defaults
    ALTER TABLE posts ALTER COLUMN status SET NOT NULL;
    
    -- Create index for faster status filtering
    CREATE INDEX idx_posts_status ON posts(status);
    
    RAISE NOTICE 'Added status column to posts table';
  ELSE
    RAISE NOTICE 'Status column already exists in posts table';
  END IF;
END $$;

-- Add removed_at and removed_reason columns for audit trail
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'removed_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE posts ADD COLUMN removed_reason TEXT;
    
    RAISE NOTICE 'Added removed_at and removed_reason columns to posts table';
  ELSE
    RAISE NOTICE 'removed_at column already exists in posts table';
  END IF;
END $$;

-- ============================================
-- PART 2: UPDATE COMMENTS TABLE
-- ============================================

-- Add status column to comments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'status'
  ) THEN
    ALTER TABLE comments ADD COLUMN status TEXT DEFAULT 'visible' CHECK (status IN ('visible', 'removed'));
    
    -- Update existing comments to 'visible' status
    UPDATE comments SET status = 'visible' WHERE status IS NULL;
    
    -- Make status NOT NULL after setting defaults
    ALTER TABLE comments ALTER COLUMN status SET NOT NULL;
    
    -- Create index for faster status filtering
    CREATE INDEX idx_comments_status ON comments(status);
    
    RAISE NOTICE 'Added status column to comments table';
  ELSE
    RAISE NOTICE 'Status column already exists in comments table';
  END IF;
END $$;

-- Add removed_at and removed_reason for comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'removed_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE comments ADD COLUMN removed_reason TEXT;
    
    RAISE NOTICE 'Added removed_at and removed_reason columns to comments table';
  ELSE
    RAISE NOTICE 'removed_at column already exists in comments table';
  END IF;
END $$;

-- ============================================
-- PART 3: CREATE REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id BIGINT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'harassment',
    'hate_speech',
    'violence',
    'sexual_content',
    'misinformation',
    'copyright',
    'other'
  )),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reports from same user
  UNIQUE(reporter_id, target_type, target_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- ============================================
-- PART 4: CREATE USER_BLOCKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id BIGSERIAL PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent self-blocking and duplicate blocks
  CHECK (blocker_id != blocked_id),
  UNIQUE(blocker_id, blocked_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- ============================================
-- PART 5: CREATE MODERATOR ROLES TABLE (Optional)
-- ============================================

-- This table tracks who has moderator permissions
CREATE TABLE IF NOT EXISTS moderators (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_moderators_user_id ON moderators(user_id);
CREATE INDEX IF NOT EXISTS idx_moderators_active ON moderators(is_active) WHERE is_active = true;

-- Helper function to check if user is moderator
CREATE OR REPLACE FUNCTION is_moderator(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM moderators 
    WHERE user_id = user_id_param AND is_active = true
  );
END;
$$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check posts table has status column:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'posts' AND column_name IN ('status', 'removed_at', 'removed_reason');

-- Check comments table has status column:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'comments' AND column_name IN ('status', 'removed_at', 'removed_reason');

-- Check reports table created:
-- SELECT * FROM information_schema.tables WHERE table_name = 'reports';

-- Check user_blocks table created:
-- SELECT * FROM information_schema.tables WHERE table_name = 'user_blocks';

-- Check moderators table created:
-- SELECT * FROM information_schema.tables WHERE table_name = 'moderators';

-- ============================================
-- NOTES FOR NEXT STEPS:
-- ============================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Next: Set up RLS policies (see supabase_ugc_rls_policies.sql)
-- 3. Then: Configure storage bucket permissions
-- 4. Finally: Update client-side code to handle moderation

