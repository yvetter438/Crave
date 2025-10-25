# Quick Test Guide - UGC Moderation

## 🚀 Step 1: Run the Fix Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Run the file: `supabase_ugc_moderation_fix.sql`
3. Look for these success messages in the output:
   - ✅ All 5 functions created successfully
   - ✅ All indexes created successfully
   - 🎉 Migration complete!

## ✅ Step 2: Verify Functions Exist

Run this in SQL Editor:

```sql
SELECT proname, pg_get_function_identity_arguments(oid) as args
FROM pg_proc 
WHERE proname IN (
  'get_comments_with_moderation',
  'get_comment_replies_with_moderation',
  'is_user_blocked',
  'get_blocked_users',
  'get_comments_with_metadata'
)
ORDER BY proname;
```

**Expected:** 5 rows returned

## 🧪 Step 3: Test in App

### Restart Your App First
```bash
# Stop the app (Ctrl+C in terminal)
# Clear cache and restart
npx expo start --clear
```

### Test 1: Post Normal Comment (30 seconds)
1. Open any video
2. Tap comments
3. Type: "This looks delicious!"
4. Send

**✅ PASS:** Comment appears
**❌ FAIL:** Error message - check console logs

### Test 2: Post Profanity (30 seconds)
1. Type: "This is fucking amazing"
2. Tap Send

**✅ PASS:** Alert blocks comment
**❌ FAIL:** Comment posts

### Test 3: Block User (1 minute)
Need 2 test accounts:

**Account A:**
1. Find comment from Account B
2. Tap "..." on comment
3. Select "Block User"
4. Confirm

**✅ PASS:** 
- Alert confirms block
- Comment disappears
- All Account B comments gone

### Test 4: Report Comment (1 minute)
1. Find any comment (not yours)
2. Tap "..." → "Report Comment"
3. Choose reason → Submit

**✅ PASS:** Success alert
**❌ FAIL:** Error message

## 🐛 If Tests Fail

### Comments Won't Load
**Check logs for:** `get_comments_with_moderation`

**Fix:**
```sql
-- Verify function exists
SELECT proname FROM pg_proc 
WHERE proname = 'get_comments_with_moderation';
```

If empty, re-run the migration.

### Can't Post Comment
**Check console for error message**

**Common issues:**
1. Status column missing → Migration will add it
2. RLS policy blocking → Check policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'comments';
```

### Profanity Filter Not Working
**Check:**
```bash
# In terminal, verify file exists
ls -la utils/profanityFilter.ts

# Restart with clear cache
npx expo start --clear
```

### Block Not Working
**Verify in database:**
```sql
-- Check if block was created
SELECT * FROM user_blocks 
ORDER BY created_at DESC LIMIT 5;
```

If empty, there might be an RLS policy issue.

## 📊 Database Verification Queries

### Check Everything is Set Up
```sql
-- Check functions (should return 5)
SELECT COUNT(*) as function_count 
FROM pg_proc 
WHERE proname IN (
  'get_comments_with_moderation',
  'get_comment_replies_with_moderation',
  'is_user_blocked',
  'get_blocked_users',
  'get_comments_with_metadata'
);

-- Check indexes (should return 5-6)
SELECT COUNT(*) as index_count
FROM pg_indexes 
WHERE indexname LIKE 'idx_user_blocks%' 
   OR indexname LIKE 'idx_comments_status%'
   OR indexname LIKE 'idx_posts_status%'
   OR indexname LIKE 'idx_reports%';

-- Check policies (should return 7)
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('user_blocks', 'reports');

-- Check comments has status column
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND column_name IN ('status', 'removed_at', 'removed_reason');
```

### Test Function Manually
```sql
-- Replace with real values
SELECT * FROM get_comments_with_moderation(
  123::bigint,  -- post_id
  'your-user-id'::uuid
);
```

Should return comments without errors.

## ✅ Success Checklist

- [ ] Migration ran without errors
- [ ] 5 functions exist
- [ ] 5+ indexes exist  
- [ ] 7 policies exist
- [ ] Comments table has status column
- [ ] Can post normal comments
- [ ] Profanity is blocked
- [ ] Can block users
- [ ] Blocked users' comments hidden
- [ ] Can report comments
- [ ] Reports appear in database

## 🎉 All Tests Pass?

You're ready! Your moderation system is fully functional.

## 📞 Still Having Issues?

### Get Detailed Error Info

In CommentSheet, look at console logs:
```
Error posting comment: [error object]
Error details: [JSON details]
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Click "Logs" → "Postgres Logs"
3. Look for errors around comment insertion

### Common Error Messages

**"function get_comments_with_moderation does not exist"**
→ Migration didn't complete. Re-run `supabase_ugc_moderation_fix.sql`

**"column 'status' does not exist"**
→ Migration step 6 didn't run. Check if comments table has status column

**"violates check constraint"**
→ Status value is invalid. Make sure you're setting status to 'visible'

**"permission denied"**
→ RLS policy issue. Check if policies exist and are correct

## 🔧 Nuclear Option

If nothing works, you can reset the moderation features:

```sql
-- WARNING: This removes all blocks and reports!
-- Only use for testing

-- Drop all functions
DROP FUNCTION IF EXISTS get_comments_with_moderation(bigint, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_comment_replies_with_moderation(bigint, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_blocked_users(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_user_blocked(uuid, uuid) CASCADE;

-- Then re-run supabase_ugc_moderation_fix.sql
```

Don't do this in production!

