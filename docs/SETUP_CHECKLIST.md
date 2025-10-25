# Apple App Store UGC Compliance - Setup Checklist

## ✅ What Was Implemented

### Client-Side Components
- ✅ Created profanity filter utility (`utils/profanityFilter.ts`)
- ✅ Updated CommentSheet to validate comments before posting
- ✅ Added block user functionality to Comment component
- ✅ Added block user functionality to VideoPost component
- ✅ Updated CommentReplies to filter blocked users
- ✅ All components now use moderation-aware queries

### Database Changes
- ✅ Created SQL migration file (`supabase_enhanced_ugc_moderation.sql`)
- ✅ New functions for filtering blocked users' content
- ✅ RLS policies for user blocks and reports
- ✅ Performance indexes added
- ✅ Helper functions for common operations

### Documentation
- ✅ Comprehensive guide (`APPLE_STORE_UGC_COMPLIANCE.md`)
- ✅ Setup instructions
- ✅ Testing procedures
- ✅ Troubleshooting guide

## 🚀 Next Steps (Do This Now!)

### Step 1: Run Database Migration
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open the file: `supabase_enhanced_ugc_moderation.sql`
4. Click "Run"
5. Wait for success confirmation

### Step 2: Verify Migration
Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Check new functions exist
SELECT proname FROM pg_proc 
WHERE proname IN (
  'get_comments_with_moderation',
  'get_comment_replies_with_moderation',
  'is_user_blocked',
  'get_blocked_users'
);
-- Should return 4 rows

-- 2. Check RLS policies exist
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('user_blocks', 'reports');
-- Should return multiple policies

-- 3. Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('user_blocks', 'comments', 'posts', 'reports')
AND indexname LIKE '%moderation%' OR indexname LIKE '%block%';
-- Should return multiple indexes
```

### Step 3: Test in Your App

#### Test 1: Profanity Filter (2 minutes)
1. Open your app
2. Navigate to any video
3. Open comments
4. Try typing: "This is fucking amazing"
5. Tap Send
6. **Expected:** Alert appears blocking the comment
7. ✅ **Pass** if alert shows, ❌ **Fail** if comment posts

#### Test 2: Block User from Comment (3 minutes)
1. Find a comment from another user
2. Tap the "..." (ellipsis) button
3. Select "Block User"
4. Confirm the block
5. **Expected:** Comment disappears immediately
6. ✅ **Pass** if comment is hidden, ❌ **Fail** if still visible

#### Test 3: Block User from Video (3 minutes)
1. Navigate to a video from a user who has multiple videos
2. Tap the "..." button on the video
3. Select "Block User"
4. Confirm the block
5. Return to main feed
6. **Expected:** Blocked user's videos don't appear in feed
7. ✅ **Pass** if filtered out, ❌ **Fail** if still showing

#### Test 4: Report Comment (2 minutes)
1. Find a comment
2. Tap "..." button
3. Select "Report Comment"
4. Choose a reason (e.g., "Spam")
5. Submit report
6. **Expected:** Confirmation message appears
7. ✅ **Pass** if confirmation shows, ❌ **Fail** if error

#### Test 5: Report Video (2 minutes)
1. Navigate to any video
2. Tap "..." button
3. Select "Report Post"
4. Choose a reason
5. Submit report
6. **Expected:** Confirmation message appears
7. ✅ **Pass** if confirmation shows, ❌ **Fail** if error

### Step 4: Check Database Data
After testing, verify data was created:

```sql
-- Check blocks were created
SELECT * FROM user_blocks 
WHERE blocker_id = 'your-test-user-id'
ORDER BY created_at DESC;

-- Check reports were created
SELECT * FROM reports 
WHERE reporter_id = 'your-test-user-id'
ORDER BY created_at DESC;
```

## 🐛 Common Issues & Fixes

### Issue: "function get_comments_with_moderation does not exist"
**Fix:** SQL migration didn't run. Go back to Step 1.

### Issue: Profanity filter not working
**Fix:** 
1. Check that `utils/profanityFilter.ts` exists
2. Verify CommentSheet.tsx imports it: `import { validateCommentText } from '@/utils/profanityFilter'`
3. Rebuild app if using Expo: `npx expo start --clear`

### Issue: Block button not showing
**Fix:**
1. Make sure you're testing with different user accounts
2. You can't block yourself - the button won't show on your own content
3. Restart app to ensure new code is loaded

### Issue: Feed still shows blocked user
**Fix:**
1. Verify the feed uses `get_ranked_feed_with_moderation` (already updated in index.tsx)
2. Pull to refresh the feed
3. Check user_blocks table has the block entry

## 📱 Apple App Store Submission Notes

When submitting to Apple, you can reference these features:

### In Your App Review Information
**Content Moderation Description:**
```
Crave implements comprehensive content moderation:

1. Pre-submission Filtering: Automated profanity detection prevents 
   offensive language from being posted in comments.

2. User Reporting: Users can report inappropriate videos and comments 
   with categorized reasons (spam, harassment, hate speech, violence, 
   sexual content, misinformation, copyright).

3. User Blocking: Users can block other users to prevent seeing their 
   content and comments, providing immediate user control over their 
   experience.

4. Moderator Review: All video uploads require manual moderator 
   approval before appearing in user feeds.

5. Privacy: Reports are confidential, and blocked users are not 
   notified, protecting reporter privacy.

Database-level security ensures blocked users' content is filtered 
from all feeds and comments.
```

### Demo Account Instructions
If Apple requests a demo account:
1. Create a test moderator account
2. Have some test posts in "pending" and "approved" status
3. Have a test user with some blocked users
4. Show example reports in the moderation queue

## 🎯 What This Gives You

### For Apple App Review
- ✅ Meets UGC content filtering requirements
- ✅ Provides user control over content they see
- ✅ Implements reporting system for inappropriate content
- ✅ Maintains user privacy (confidential reports)
- ✅ Shows active moderation of content

### For Your Users
- ✅ Safe, respectful community
- ✅ Control over their experience
- ✅ Protection from harassment
- ✅ Confidence that reports are handled
- ✅ Clean, filtered content

### For Your Moderation Team
- ✅ Centralized report queue
- ✅ User-submitted reports with context
- ✅ Tools to remove inappropriate content
- ✅ Audit trail of actions
- ✅ Blocked users don't burden support

## 📊 Expected Database Size Impact

After 1,000 active users:
- **user_blocks:** ~50-200 rows (5-20% of users block someone)
- **reports:** ~100-500 rows (10-50% submit at least one report)
- **Storage:** <1MB additional

Performance impact: Negligible with provided indexes.

## 🚨 Important Notes

1. **Testing:** Test with multiple accounts - you can't block or report yourself
2. **Migration:** Run the SQL migration BEFORE testing features
3. **Refresh:** May need to pull-to-refresh or restart app to see changes
4. **Moderators:** Your existing moderator system will receive the reports
5. **Privacy:** Users can't see who blocked or reported them

## ✅ Final Checklist Before App Store Submission

- [ ] SQL migration run successfully
- [ ] All 5 tests passed
- [ ] Database shows blocks and reports being created
- [ ] Tested with multiple user accounts
- [ ] Profanity filter working
- [ ] Block functionality working
- [ ] Report functionality working
- [ ] Feed filtering working
- [ ] Comments filtering working
- [ ] No console errors in production build

## 🎉 You're Ready!

Once all items are checked, your UGC moderation system is fully functional and Apple App Store compliant!

**Questions or Issues?**
Refer to the detailed guide in `APPLE_STORE_UGC_COMPLIANCE.md`

