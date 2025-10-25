# Manual Moderation Setup Guide

This guide will help you set up complete manual moderation for your UGC video app, ensuring you can personally review and approve all content to maintain quality.

---

## 📋 Complete Setup Checklist

### Step 1: Database Setup

Run these SQL files in order in your Supabase SQL Editor:

1. **`supabase_ugc_moderation_migration.sql`**
   - Adds `status` column to posts and comments
   - Creates `reports`, `user_blocks`, and `moderators` tables
   - Creates helper functions

2. **`supabase_ugc_rls_policies.sql`**
   - Sets up Row Level Security policies
   - Ensures only approved content is public
   - Allows moderators to see everything
   - Creates feed functions with moderation

3. **`supabase_add_moderator_columns.sql`**
   - Adds `removed_at` and `removed_reason` columns
   - Adds you as a moderator

4. **`supabase_feed_simple_moderation.sql`**
   - Creates simplified feed function (better performance)
   - Filters approved posts and blocked users

5. **`supabase_storage_policies_fix.sql`** ⚠️ **CRITICAL**
   - Sets up storage bucket policies for both `videos` and `posts-videos` buckets
   - Allows moderators to upload to public bucket
   - Allows users to upload to private bucket
   - **Without this, video approval will fail!**

### Step 2: Storage Configuration

Follow **`SUPABASE_STORAGE_SETUP.md`** to configure:

- **`videos`** bucket (private) - For pending uploads
- **`posts-videos`** bucket (public) - For approved content
- Set allowed MIME types to `video/*`
- Apply RLS policies for bucket access

### Step 3: Add Yourself as Moderator

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Add yourself as a moderator (replace YOUR_USER_ID)
INSERT INTO moderators (user_id, granted_by)
VALUES ('YOUR_USER_ID', 'YOUR_USER_ID')
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT 
  m.id,
  m.user_id,
  au.email,
  m.granted_at
FROM moderators m
JOIN auth.users au ON m.user_id = au.id;
```

---

## 🎯 Using the Moderator Dashboard

### Accessing the Dashboard

1. Open your app
2. Go to **Settings** (Profile tab → Settings button)
3. You'll see a blue **"Moderator Dashboard"** button (with shield icon)
4. Tap to open the moderation interface

### Reviewing Content

The dashboard shows:
- All pending posts with video previews
- Post description and metadata
- Post ID and user info
- Number of posts pending review

For each post, you can:

#### ✅ **Approve**
Approving a post will:
1. Download video from private `videos` bucket
2. Upload to public `posts-videos` bucket
3. Update post with new public URL
4. Set `status = 'approved'`
5. Delete from private bucket (cleanup)
6. Make visible in public feed

#### ❌ **Reject**
Rejecting a post will:
1. Prompt you for a reason
2. Set `status = 'removed'`
3. Keep video in private bucket (audit trail)
4. Hide from all feeds
5. Record removal reason and timestamp

---

## 🔄 Content Workflow

### User Uploads Video
```
1. User selects video via image picker
2. Video uploads to private `videos` bucket
3. Post created with status='pending'
4. User can see their own pending post
5. Public cannot see it yet
```

### You Review & Approve
```
1. Open Moderator Dashboard
2. Video plays automatically
3. Review content quality
4. Tap "Approve"
5. System moves video to public bucket
6. Post appears in public feed
```

### Quality Control
```
✅ Only content YOU approve goes public
✅ Maintain app quality standards
✅ Prevent inappropriate content
✅ Build trust with users
✅ Apple App Store compliant
```

---

## 🛡️ Apple App Store Compliance

Your moderation system meets Apple's requirements:

### ✅ Pre-Moderation
- All uploads default to `status='pending'`
- Content only goes public after manual approval
- Clear separation of pending vs. approved content

### ✅ User Safety Features
- Report button on all posts/comments
- Block user functionality
- RLS policies enforce content visibility
- Moderator can remove content

### ✅ Transparency
- Terms of Use page (`/terms`)
- Community Guidelines page (`/guidelines`)
- Clear moderation policies

### 📝 For App Review Submission

Include this in your **App Review Notes**:

```
Content Moderation:
- All user-uploaded videos require manual approval before appearing publicly
- Users can report inappropriate content
- Users can block other users
- Dedicated moderator tools for content review
- Videos are stored in private bucket until approved
- Moderators can remove content with reason tracking
```

---

## 📊 Monitoring & Maintenance

### Check Pending Posts

**Via Dashboard:**
- Open Moderator Dashboard
- Shows count at top: "X posts pending review"
- Refresh button to reload

**Via SQL:**
```sql
-- Count pending posts
SELECT COUNT(*) as pending_count
FROM posts
WHERE status = 'pending';

-- View pending with user info
SELECT 
  p.id,
  p.created_at,
  p.description,
  pr.username,
  pr.email
FROM posts p
JOIN profiles pr ON pr.user_id = p."user"
WHERE p.status = 'pending'
ORDER BY p.created_at ASC;
```

### Review Reports

```sql
-- See all pending reports
SELECT 
  r.id,
  r.target_type,
  r.target_id,
  r.reason,
  r.created_at,
  reporter.username as reporter
FROM reports r
JOIN profiles reporter ON reporter.user_id = r.reporter_id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC;

-- Mark report as reviewed
UPDATE reports
SET status = 'reviewed'
WHERE id = REPORT_ID;
```

### Content Statistics

```sql
-- Overall content stats
SELECT 
  status,
  COUNT(*) as count
FROM posts
GROUP BY status;

-- Approval rate (last 7 days)
SELECT 
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'removed' THEN 1 END) as rejected,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN status = 'approved' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as approval_rate
FROM posts
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🚀 Best Practices

### Daily Moderation Routine

1. **Morning Check** (5-10 min)
   - Open Moderator Dashboard
   - Review overnight submissions
   - Approve quality content
   - Reject violations

2. **Throughout Day** (as needed)
   - Check pending count
   - Quick reviews
   - Respond to reports

3. **Evening Check** (5 min)
   - Final review
   - Clear backlog

### Quality Standards Checklist

When reviewing posts, check for:

✅ **Video Quality**
- Clear, not blurry
- Proper lighting
- Appropriate length
- Actually shows food/restaurant

✅ **Content Appropriateness**
- No offensive material
- Relevant to food/restaurants
- No spam or promotions
- Follows community guidelines

✅ **Description Quality**
- Meaningful description
- Not just emojis or spam
- Actually describes the content

### Rejection Reasons (Consistent)

Keep reasons consistent for tracking:
- `inappropriate_content` - Offensive or explicit
- `poor_quality` - Blurry, dark, or unwatchable
- `spam` - Promotional or repetitive
- `off_topic` - Not food/restaurant related
- `misleading` - False information or clickbait
- `copyright` - Uses copyrighted material
- `duplicate` - Already posted

---

## 🔧 Troubleshooting

### "Not Authorized" When Opening Dashboard

**Problem:** You're not in the moderators table

**Solution:**
```sql
-- Check if you're a moderator
SELECT * FROM moderators WHERE user_id = 'YOUR_USER_ID';

-- If not found, add yourself
INSERT INTO moderators (user_id, granted_by)
VALUES ('YOUR_USER_ID', 'YOUR_USER_ID')
ON CONFLICT (user_id) DO NOTHING;
```

### Video Won't Play in Dashboard

**Problem:** Signed URL expired or storage policy issue

**Solutions:**
1. Check storage policies in `SUPABASE_STORAGE_SETUP.md`
2. Verify `videos` bucket exists and is private
3. Ensure moderator has bucket read access
4. Refresh the dashboard

### Approved Video Not Appearing in Feed

**Problem:** Video URL not updated or feed not refreshing

**Solutions:**
1. Check post status: `SELECT id, status, video_url FROM posts WHERE id = X;`
2. Verify video exists in `posts-videos` bucket
3. Check if video_url is a full URL (starts with `https://`)
4. Pull down to refresh feed in app

### Video Bucket Full

**Problem:** Too many pending videos in private bucket

**Solutions:**
1. Approve or reject pending posts
2. Run cleanup for old removed posts:
```sql
-- Find old removed posts (>30 days)
SELECT id, video_url, removed_at 
FROM posts 
WHERE status = 'removed' 
  AND removed_at < NOW() - INTERVAL '30 days';

-- Delete old removed posts (manual cleanup)
DELETE FROM posts 
WHERE status = 'removed' 
  AND removed_at < NOW() - INTERVAL '30 days';
```

---

## 📱 Mobile Moderation Tips

Since the dashboard is in your React Native app:

✅ **You can moderate from anywhere!**
- On your phone
- During commute
- While relaxing
- Quick reviews on-the-go

✅ **Push Notifications (Future)**
- Get notified of new submissions
- Set moderation hours
- Batch review during set times

✅ **Efficient Reviews**
- Videos autoplay for quick assessment
- One-tap approval
- Required rejection reason ensures accountability

---

## 📈 Scaling Up

### When You Need Help

As your app grows, you may want additional moderators:

```sql
-- Add another moderator
INSERT INTO moderators (user_id, granted_by)
VALUES ('THEIR_USER_ID', 'YOUR_USER_ID')  -- You're granting them access
ON CONFLICT (user_id) DO NOTHING;

-- Remove a moderator
DELETE FROM moderators WHERE user_id = 'THEIR_USER_ID';
```

### Automated Pre-Screening (Future)

Consider adding:
- AI content analysis (OpenAI/Anthropic APIs)
- Automatic rejection of obvious violations
- Flagging suspicious content
- Trust scores for established users

But always keep **final human approval** for quality!

---

## ✅ You're All Set!

Your manual moderation system is now complete. You have:

✅ **Full Control** - Nothing goes public without your approval
✅ **Professional Tools** - In-app dashboard with video preview
✅ **Apple Compliance** - Pre-moderation system meets requirements
✅ **User Safety** - Report and block features
✅ **Quality Assurance** - Maintain high content standards
✅ **Audit Trail** - Track all moderation decisions
✅ **Mobile Access** - Review from anywhere

Remember: Quality over quantity. Your manual review ensures users get the best content! 🎉

