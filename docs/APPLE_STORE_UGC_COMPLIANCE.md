# Apple App Store UGC Compliance Implementation

## Overview
This document outlines the comprehensive User-Generated Content (UGC) moderation features implemented to meet Apple App Store guidelines and ensure a safe, respectful community on Crave.

## ✅ Implemented Features

### 1. Comment Profanity Filtering
**Location:** `utils/profanityFilter.ts`

**What it does:**
- Filters offensive language before comments are posted
- Checks for common profanity, slurs, and hate speech
- Validates comment length and content
- Detects spam patterns (excessive URLs, repetition)

**How it works:**
- When a user tries to post a comment, the text is validated
- If profanity or spam is detected, an alert is shown and the comment is blocked
- Users receive clear feedback about why their comment was rejected

**User Experience:**
```
User types: "This is f*cking amazing!"
System: Shows alert "Cannot Post Comment - Your comment contains inappropriate language..."
```

### 2. Reporting System

#### For Comments
**Location:** `components/Comment.tsx`, `components/ReportModal.tsx`

**What it does:**
- Users can report offensive comments
- Comments can be reported for: spam, harassment, hate speech, violence, sexual content, misinformation, copyright, or other reasons
- Reports are confidential - the reported user won't know who reported them

**How to use:**
1. Tap the "..." (ellipsis) button on any comment (that's not your own)
2. Choose "Report Comment"
3. Select a reason and optionally provide additional details
4. Submit the report

#### For Videos/Posts
**Location:** `components/VideoPost.tsx`, `components/ReportModal.tsx`

**What it does:**
- Users can report offensive or inappropriate videos
- Same reporting categories as comments
- Integrates with existing moderation system

**How to use:**
1. Tap the "..." button on the video overlay
2. Choose "Report Post"
3. Select a reason and provide details
4. Submit the report

### 3. User Blocking System

#### Block from Comments
**Location:** `components/Comment.tsx`, `components/BlockUserModal.tsx`

**What it does:**
- Users can block abusive commenters
- Blocked users' comments are immediately hidden
- The blocked user won't be notified

**How to use:**
1. Tap the "..." button on a comment
2. Choose "Block User"
3. Confirm the block
4. All comments from that user disappear immediately

#### Block from Videos
**Location:** `components/VideoPost.tsx`, `components/BlockUserModal.tsx`

**What it does:**
- Users can block content creators
- Blocked users' videos won't appear in your feed
- The blocked user won't be notified

**How to use:**
1. Tap the "..." button on a video
2. Choose "Block User"
3. Confirm the block
4. Navigate back to feed (blocked user's content is filtered out)

### 4. Content Filtering

#### Blocked Users' Content is Hidden
**What gets filtered:**
- ✅ Videos/posts from blocked users don't appear in feed
- ✅ Comments from blocked users are hidden
- ✅ Replies from blocked users are hidden
- ✅ Feed automatically updates when blocking/unblocking

**Database Functions:**
- `get_ranked_feed_with_moderation` - Filters posts
- `get_comments_with_moderation` - Filters comments
- `get_comment_replies_with_moderation` - Filters replies

### 5. Moderation Status Integration

**Status Types:**

**For Posts:**
- `pending` - Awaiting moderator review (not shown in feed)
- `approved` - Reviewed and approved (shown in feed)
- `removed` - Removed by moderators (not shown anywhere)

**For Comments:**
- `visible` - Normal, visible comment
- `removed` - Removed by moderators (not shown)

**Feed Behavior:**
- Only `approved` posts appear in feeds
- Only `visible` comments appear on posts
- Removed content is never shown to users

## 🗄️ Database Schema

### Tables

#### `user_blocks`
```sql
- id (bigserial, primary key)
- blocker_id (uuid, references auth.users)
- blocked_id (uuid, references auth.users)
- created_at (timestamptz)
- UNIQUE(blocker_id, blocked_id)
- CHECK(blocker_id != blocked_id) -- Can't block yourself
```

#### `reports`
```sql
- id (bigserial, primary key)
- reporter_id (uuid, references auth.users)
- target_type (text: 'post', 'comment', 'user')
- target_id (bigint)
- reason (text: 'spam', 'harassment', 'hate_speech', etc.)
- description (text, optional)
- status (text: 'pending', 'reviewed', 'resolved', 'dismissed')
- reviewed_by (uuid, references auth.users)
- reviewed_at (timestamptz)
- created_at (timestamptz)
- UNIQUE(reporter_id, target_type, target_id) -- One report per user per item
```

#### Posts & Comments Status Columns
```sql
-- Posts
ALTER TABLE posts ADD COLUMN status text DEFAULT 'pending';
ALTER TABLE posts ADD COLUMN removed_at timestamptz;
ALTER TABLE posts ADD COLUMN removed_reason text;

-- Comments
ALTER TABLE comments ADD COLUMN status text DEFAULT 'visible';
ALTER TABLE comments ADD COLUMN removed_at timestamptz;
ALTER TABLE comments ADD COLUMN removed_reason text;
```

### Row-Level Security (RLS) Policies

#### User Blocks
- ✅ Users can view their own blocks
- ✅ Users can create blocks (block others)
- ✅ Users can delete blocks (unblock)
- ❌ Users cannot view others' block lists

#### Reports
- ✅ Users can view their own submitted reports
- ✅ Users can create new reports
- ✅ Moderators can view all reports
- ✅ Moderators can update report status
- ❌ Users cannot view reports submitted by others

### Database Functions

#### `get_comments_with_moderation(p_post_id, p_user_id)`
Returns comments for a post with moderation filters:
- Filters out comments from blocked users
- Only returns `visible` comments
- Includes like counts and user metadata

#### `get_comment_replies_with_moderation(p_parent_comment_id, p_user_id)`
Returns replies to a comment with moderation filters:
- Filters out replies from blocked users
- Only returns `visible` replies

#### `get_ranked_feed_with_moderation(p_user_id, p_limit, p_offset, p_seed)`
Returns feed posts with moderation filters:
- Only returns `approved` posts
- Filters out posts from blocked users
- Applies engagement-based ranking

#### `is_user_blocked(blocker_id_param, blocked_id_param)`
Helper function to check if one user has blocked another.

#### `get_blocked_users(p_user_id)`
Returns list of users that the specified user has blocked.
Useful for managing blocks in settings.

## 📊 Performance Optimizations

### Indexes Created
```sql
-- Blocking queries
idx_user_blocks_blocker_blocked (blocker_id, blocked_id)
idx_user_blocks_blocked (blocked_id)

-- Content status filtering
idx_comments_status_visible (status) WHERE status = 'visible'
idx_posts_status_approved (status) WHERE status = 'approved'

-- Report management
idx_reports_status_pending (status) WHERE status = 'pending'
idx_reports_target_composite (target_type, target_id, status)
```

## 🚀 Setup Instructions

### 1. Run SQL Migration
```bash
# In Supabase Dashboard -> SQL Editor
# Run the file: supabase_enhanced_ugc_moderation.sql
```

This migration will:
- Create new database functions with moderation filters
- Set up RLS policies for user_blocks and reports
- Add performance indexes
- Create helper functions

### 2. Verify Migration
```sql
-- Check functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%moderation%';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('user_blocks', 'reports');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('user_blocks', 'comments', 'posts', 'reports');
```

### 3. Test Features

#### Test Profanity Filter
1. Open app and go to any video
2. Tap to open comments
3. Try posting: "This is shit"
4. Should see alert: "Cannot Post Comment"

#### Test Comment Reporting
1. Find a comment (not your own)
2. Tap "..." button
3. Select "Report Comment"
4. Choose reason, submit
5. Should see confirmation

#### Test User Blocking
1. Find a comment or video from another user
2. Tap "..." button
3. Select "Block User"
4. Confirm block
5. Content should disappear immediately

#### Test Feed Filtering
1. Block a user who has posted videos
2. Go back to main feed
3. Their videos should not appear
4. Unblock them (if you add unblock feature)
5. Their videos should reappear on refresh

## 🔒 Privacy & Security

### User Privacy
- ✅ Reports are confidential - reported users never know who reported them
- ✅ Blocks are private - blocked users don't get notifications
- ✅ Users can only see their own reports and blocks
- ✅ RLS policies prevent unauthorized data access

### Content Security
- ✅ Profanity filter runs client-side before submission
- ✅ Database constraints prevent invalid data
- ✅ Moderators have tools to review and act on reports
- ✅ Removed content stays in database for audit but isn't displayed

### Data Integrity
- ✅ Can't block yourself (CHECK constraint)
- ✅ Can't report the same thing twice (UNIQUE constraint)
- ✅ Foreign key constraints maintain referential integrity
- ✅ Timestamps track all actions for audit trail

## 📱 User Experience Flow

### Scenario 1: User sees offensive comment
1. User taps "..." on offensive comment
2. Sees options: "Report Comment" or "Block User"
3. If reports: Selects reason → Submits → Gets confirmation
4. If blocks: Confirms block → Comment disappears immediately
5. System: Report goes to moderator queue OR Block is recorded

### Scenario 2: User tries to post profanity
1. User types comment with profanity
2. User taps "Send"
3. System validates text
4. Alert shows: "Cannot Post Comment - inappropriate language"
5. User edits comment
6. Resubmits successfully

### Scenario 3: Feed filtering after block
1. User blocks content creator
2. System records block in user_blocks table
3. User returns to feed
4. Feed query excludes blocked user's posts
5. User scrolls without seeing blocked content

## 🛠️ Moderator Tools Integration

Your existing moderator system now works seamlessly with reports:

### Reports Dashboard
Moderators can:
- View all pending reports (using reports table)
- See report details (reason, description, reporter)
- Update report status (pending → reviewed → resolved/dismissed)
- Take action on reported content (approve, remove)

### Content Moderation
- Moderators can set post status to `removed`
- Moderators can set comment status to `removed`
- Removed content disappears from all feeds immediately
- Audit trail maintained with `removed_at` and `removed_reason`

## 🎯 Apple App Store Compliance Checklist

### Required Features
- ✅ **Profanity Filter:** Comments are filtered before posting
- ✅ **Report Offensive Comments:** Users can report comments with categorized reasons
- ✅ **Report Videos:** Users can report posts/videos
- ✅ **Block Abusive Users:** Full blocking system implemented
- ✅ **Hide Blocked Content:** Comments and videos from blocked users are filtered
- ✅ **Integration with Moderation:** Reports go to moderators for review
- ✅ **User Privacy:** Reports are confidential, blocks are private

### Documentation for App Review
When submitting to Apple, mention:
1. **Content Moderation:** All videos require moderator approval before appearing in feed
2. **Profanity Filtering:** Automated filtering of offensive language in comments
3. **User Reporting:** Comprehensive reporting system for all UGC
4. **User Blocking:** Users can block others to prevent harassment
5. **Moderator Tools:** Dedicated moderation system to review and act on reports

## 📋 Future Enhancements (Optional)

### User Settings Page
- List of blocked users with unblock option
- View your submitted reports
- Report history and status

### Enhanced Filtering
- Add more words to profanity list
- Machine learning-based toxicity detection
- Language-specific filtering

### Advanced Moderation
- Auto-flag comments with high toxicity scores
- Shadow ban users with repeat violations
- Appeal system for removed content

## 🐛 Troubleshooting

### Comments not filtering
- Check that SQL migration ran successfully
- Verify RLS policies are enabled: `SELECT * FROM pg_policies WHERE tablename = 'user_blocks'`
- Check function exists: `SELECT * FROM pg_proc WHERE proname = 'get_comments_with_moderation'`

### Profanity filter not working
- Verify import: `import { validateCommentText } from '@/utils/profanityFilter'`
- Check that CommentSheet.tsx has the validation code
- Test in development with console.logs

### Blocks not persisting
- Check user_blocks table has data: `SELECT * FROM user_blocks WHERE blocker_id = 'your-user-id'`
- Verify RLS policies allow inserts
- Check for database errors in console

### Feed still showing blocked users
- Verify feed uses `get_ranked_feed_with_moderation` function
- Check that feed query includes user ID parameter
- Confirm blocked user exists in user_blocks table

## 📞 Support

If you encounter issues:
1. Check Supabase logs for database errors
2. Check browser/app console for JavaScript errors
3. Verify all migrations ran successfully
4. Test with different user accounts

## 🎉 Summary

You now have a comprehensive, Apple App Store-compliant UGC moderation system that:
- ✅ Prevents offensive language from being posted
- ✅ Allows users to report inappropriate content
- ✅ Enables users to block abusive users
- ✅ Filters blocked users' content from all feeds
- ✅ Integrates seamlessly with your existing moderation tools
- ✅ Maintains user privacy and data security
- ✅ Provides clear feedback and user control

**Your app is now ready for App Store submission with robust content moderation! 🚀**

