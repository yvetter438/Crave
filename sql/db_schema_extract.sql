-- ============================================
-- DATABASE SCHEMA EXTRACTION - COMPREHENSIVE VIEW
-- Run this ENTIRE query in Supabase SQL Editor
-- ============================================

WITH 

-- 1. All Tables
all_tables AS (
  SELECT 
    '1. TABLES' as section,
    table_name as detail,
    table_type as value,
    '' as extra
  FROM information_schema.tables 
  WHERE table_schema = 'public'
),

-- 2. Profiles Table Columns
profiles_columns AS (
  SELECT 
    '2. PROFILES COLUMNS' as section,
    column_name as detail,
    data_type as value,
    CASE 
      WHEN column_name IN ('bio', 'location', 'instagram_handle', 'followers_count', 'following_count', 'likes_count') 
      THEN '⚠️ NEW FIELD'
      ELSE '✓ EXISTS'
    END as extra
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'profiles'
),

-- 3. Posts Table Columns  
posts_columns AS (
  SELECT 
    '3. POSTS COLUMNS' as section,
    column_name as detail,
    data_type as value,
    '' as extra
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'posts'
),

-- 4. Other Important Tables
other_tables AS (
  SELECT 
    '4. OTHER TABLES' as section,
    table_name || ' (' || COUNT(*) || ' columns)' as detail,
    '' as value,
    '' as extra
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name NOT IN ('profiles', 'posts')
  GROUP BY table_name
),

-- 5. Custom Functions
custom_functions AS (
  SELECT
    '5. CUSTOM FUNCTIONS' as section,
    routine_name as detail,
    data_type as value,
    '' as extra
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
),

-- 6. Foreign Keys
foreign_keys AS (
  SELECT
    '6. FOREIGN KEYS' as section,
    tc.table_name || '.' || kcu.column_name as detail,
    '→ ' || ccu.table_name || '.' || ccu.column_name as value,
    'ON DELETE ' || rc.delete_rule as extra
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
),

-- 7. RLS Policies
rls_policies AS (
  SELECT
    '7. RLS POLICIES' as section,
    tablename || ': ' || policyname as detail,
    cmd as value,
    CASE WHEN permissive = 'PERMISSIVE' THEN '✓ Permissive' ELSE '⚠️ Restrictive' END as extra
  FROM pg_policies
  WHERE schemaname = 'public'
),

-- 8. Storage Buckets
storage_buckets AS (
  SELECT
    '8. STORAGE BUCKETS' as section,
    name as detail,
    CASE WHEN public THEN '🌐 Public' ELSE '🔒 Private' END as value,
    id::text as extra
  FROM storage.buckets
)

-- Combine all results
SELECT * FROM all_tables
UNION ALL SELECT * FROM profiles_columns
UNION ALL SELECT * FROM posts_columns  
UNION ALL SELECT * FROM other_tables
UNION ALL SELECT * FROM custom_functions
UNION ALL SELECT * FROM foreign_keys
UNION ALL SELECT * FROM rls_policies
UNION ALL SELECT * FROM storage_buckets
ORDER BY section, detail;

-- ============================================
-- AFTER VIEWING ABOVE, RUN THESE INDIVIDUALLY:
-- ============================================

-- ROW COUNTS (Run separately)
-- SELECT 
--   'profiles' as table_name,
--   COUNT(*) as rows
-- FROM profiles
-- UNION ALL
-- SELECT 'posts', COUNT(*) FROM posts
-- UNION ALL  
-- SELECT 'likes', COUNT(*) FROM likes
-- UNION ALL
-- SELECT 'saves', COUNT(*) FROM saves
-- UNION ALL
-- SELECT 'impressions', COUNT(*) FROM impressions
-- UNION ALL
-- SELECT 'watch_events', COUNT(*) FROM watch_events;

-- SAMPLE PROFILE DATA (Run separately)
-- SELECT
--   username,
--   displayname,
--   CASE WHEN avatar_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_avatar,
--   created_at
-- FROM profiles
-- ORDER BY created_at DESC
-- LIMIT 10;

