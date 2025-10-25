# Moderation Tools & Manual Content Review

This document contains tools and SQL queries for moderating user-generated content in Crave.

## 🎯 Recommended: Use the In-App Moderator Dashboard

### Access the Moderator Screen

1. Navigate to `/moderator` in your app (you can add a button in Settings or use deep linking)
2. The screen will show all pending posts with video previews
3. Review each post and click **Approve** or **Reject**
4. Approval automatically:
   - Moves video from private `videos` bucket to public `posts-videos` bucket
   - Updates post status to `approved`
   - Makes content visible to all users
   - Cleans up the private bucket

### First Time Setup

Run this in Supabase SQL Editor to add yourself as a moderator:

```sql
-- Step 1: Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Add yourself as a moderator (replace YOUR_USER_ID)
INSERT INTO moderators (user_id, granted_by)
VALUES ('YOUR_USER_ID', 'YOUR_USER_ID')
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Run the moderator columns migration
-- See: supabase_add_moderator_columns.sql
```

## 📱 In-App Moderation Workflow

**Recommended for day-to-day moderation:**

1. Open the Moderator Dashboard (`/moderator`)
2. Review pending posts (video plays automatically)
3. Click **Approve** to:
   - Move video to public bucket
   - Make post visible to everyone
   - Update status to `approved`
4. Click **Reject** to:
   - Remove post from feed
   - Keep video in private bucket (for audit)
   - Require a rejection reason

**Benefits:**
- Visual review with video playback
- One-click approval/rejection
- Automatic video bucket management
- Mobile-friendly (can moderate from your phone!)

---

## 🛠️ Alternative: SQL Queries for Advanced Users

## Content Moderation Queries

### View Pending Posts

```sql
-- See all pending posts awaiting approval
SELECT 
  p.id,
  p.created_at,
  p.description,
  p.video_url,
  pr.username,
  pr.displayname,
  p.status
FROM posts p
JOIN profiles pr ON pr.user_id = p."user"
WHERE p.status = 'pending'
ORDER BY p.created_at DESC;
```

### Approve a Post

```sql
-- Approve a post by ID
UPDATE posts
SET status = 'approved'
WHERE id = POST_ID_HERE;

-- Example:
-- UPDATE posts SET status = 'approved' WHERE id = 123;
```

### Approve Multiple Posts at Once

```sql
-- Approve multiple posts (useful after reviewing a batch)
UPDATE posts
SET status = 'approved'
WHERE id IN (123, 456, 789);
```

### Approve All Posts from a Trusted User

```sql
-- Approve all pending posts from a specific user
UPDATE posts
SET status = 'approved'
WHERE "user" = 'USER_ID_HERE'
  AND status = 'pending';
```

### Remove a Post

```sql
-- Remove a post and log the reason
UPDATE posts
SET 
  status = 'removed',
  removed_at = NOW(),
  removed_reason = 'Reason for removal here'
WHERE id = POST_ID_HERE;

-- Example:
-- UPDATE posts
-- SET status = 'removed', removed_at = NOW(), removed_reason = 'Spam content'
-- WHERE id = 123;
```

### View Post with Full Details

```sql
-- Get full details about a specific post
SELECT 
  p.*,
  pr.username,
  pr.displayname,
  pr.avatar_url,
  COUNT(DISTINCT l.id) as likes_count,
  COUNT(DISTINCT c.id) as comments_count,
  COUNT(DISTINCT r.id) as reports_count
FROM posts p
LEFT JOIN profiles pr ON pr.user_id = p."user"
LEFT JOIN likes l ON l.post_id = p.id
LEFT JOIN comments c ON c.post_id = p.id
LEFT JOIN reports r ON r.target_type = 'post' AND r.target_id = p.id
WHERE p.id = POST_ID_HERE
GROUP BY p.id, pr.username, pr.displayname, pr.avatar_url;
```

## Comments Moderation

### View Reported Comments

```sql
-- See all reported comments
SELECT 
  c.id,
  c.text,
  c.created_at,
  pr.username,
  COUNT(DISTINCT r.id) as report_count,
  c.status
FROM comments c
JOIN profiles pr ON pr.user_id = c.user_id
LEFT JOIN reports r ON r.target_type = 'comment' AND r.target_id = c.id
WHERE c.status = 'visible'
  AND EXISTS (
    SELECT 1 FROM reports
    WHERE target_type = 'comment' AND target_id = c.id
  )
GROUP BY c.id, c.text, c.created_at, pr.username, c.status
ORDER BY report_count DESC, c.created_at DESC;
```

### Remove a Comment

```sql
-- Remove a comment
UPDATE comments
SET 
  status = 'removed',
  removed_at = NOW(),
  removed_reason = 'Reason for removal'
WHERE id = COMMENT_ID_HERE;
```

## Reports Management

### View All Pending Reports

```sql
-- See all pending reports with details
SELECT 
  r.id,
  r.created_at,
  r.target_type,
  r.target_id,
  r.reason,
  r.description,
  reporter.username as reporter_username,
  CASE 
    WHEN r.target_type = 'post' THEN (
      SELECT pr.username 
      FROM posts p 
      JOIN profiles pr ON pr.user_id = p."user" 
      WHERE p.id = r.target_id
    )
    WHEN r.target_type = 'comment' THEN (
      SELECT pr.username 
      FROM comments c 
      JOIN profiles pr ON pr.user_id = c.user_id 
      WHERE c.id = r.target_id
    )
    WHEN r.target_type = 'user' THEN (
      SELECT pr.username 
      FROM profiles pr 
      WHERE pr.user_id = r.target_id::text
    )
  END as target_username
FROM reports r
JOIN profiles reporter ON reporter.user_id = r.reporter_id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC
LIMIT 50;
```

### Mark Report as Reviewed

```sql
-- Mark report as reviewed after taking action
UPDATE reports
SET 
  status = 'resolved',
  reviewed_by = 'YOUR_MODERATOR_USER_ID',
  reviewed_at = NOW()
WHERE id = REPORT_ID_HERE;
```

### Dismiss a Report (False positive)

```sql
-- Dismiss a report if it's not valid
UPDATE reports
SET 
  status = 'dismissed',
  reviewed_by = 'YOUR_MODERATOR_USER_ID',
  reviewed_at = NOW()
WHERE id = REPORT_ID_HERE;
```

### Reports Summary by Type

```sql
-- See report statistics
SELECT 
  reason,
  COUNT(*) as count,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
FROM reports
GROUP BY reason
ORDER BY count DESC;
```

## User Management

### View User Activity Summary

```sql
-- Get overview of a user's content
SELECT 
  pr.username,
  pr.displayname,
  pr.created_at as user_since,
  COUNT(DISTINCT p.id) as total_posts,
  COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as approved_posts,
  COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as pending_posts,
  COUNT(DISTINCT CASE WHEN p.status = 'removed' THEN p.id END) as removed_posts,
  COUNT(DISTINCT c.id) as total_comments,
  COUNT(DISTINCT r_about.id) as reports_against_user,
  COUNT(DISTINCT r_by.id) as reports_by_user
FROM profiles pr
LEFT JOIN posts p ON p."user" = pr.user_id
LEFT JOIN comments c ON c.user_id = pr.user_id
LEFT JOIN reports r_about ON r_about.target_type = 'user' AND r_about.target_id = pr.user_id::bigint
LEFT JOIN reports r_by ON r_by.reporter_id = pr.user_id
WHERE pr.user_id = 'USER_ID_HERE'
GROUP BY pr.username, pr.displayname, pr.created_at;
```

### Find Problematic Users

```sql
-- Users with multiple reports
SELECT 
  pr.username,
  pr.user_id,
  COUNT(DISTINCT r.id) as report_count,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'removed') as removed_posts_count
FROM profiles pr
LEFT JOIN posts p ON p."user" = pr.user_id
LEFT JOIN reports r ON (
  (r.target_type = 'post' AND r.target_id IN (SELECT id FROM posts WHERE "user" = pr.user_id))
  OR (r.target_type = 'comment' AND r.target_id IN (SELECT id FROM comments WHERE user_id = pr.user_id))
  OR (r.target_type = 'user' AND r.target_id = pr.user_id::bigint)
)
GROUP BY pr.username, pr.user_id
HAVING COUNT(DISTINCT r.id) >= 3
ORDER BY report_count DESC;
```

## Bulk Operations

### Approve All Posts Older Than X Days from Trusted Users

```sql
-- Auto-approve old pending posts from users with no violations
UPDATE posts
SET status = 'approved'
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '7 days'
  AND "user" NOT IN (
    -- Exclude users who have had content removed
    SELECT DISTINCT "user" 
    FROM posts 
    WHERE status = 'removed'
  );
```

### Clean Up Old Dismissed Reports

```sql
-- Archive old dismissed reports (optional)
DELETE FROM reports
WHERE status = 'dismissed'
  AND reviewed_at < NOW() - INTERVAL '90 days';
```

## Statistics & Monitoring

### Moderation Dashboard Query

```sql
-- Get current moderation statistics
SELECT 
  'Pending Posts' as metric,
  COUNT(*) as count
FROM posts WHERE status = 'pending'
UNION ALL
SELECT 
  'Pending Reports',
  COUNT(*)
FROM reports WHERE status = 'pending'
UNION ALL
SELECT 
  'Removed Posts (Last 30 days)',
  COUNT(*)
FROM posts 
WHERE status = 'removed' 
  AND removed_at > NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
  'Removed Comments (Last 30 days)',
  COUNT(*)
FROM comments 
WHERE status = 'removed' 
  AND removed_at > NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
  'Active Moderators',
  COUNT(*)
FROM moderators WHERE is_active = true;
```

### Recent Moderation Activity

```sql
-- See what's been moderated recently
SELECT 
  'post' as content_type,
  id,
  description as content_preview,
  status,
  removed_at as action_date,
  removed_reason as reason
FROM posts
WHERE status IN ('approved', 'removed')
  AND (
    (status = 'approved' AND created_at > NOW() - INTERVAL '1 day')
    OR (status = 'removed' AND removed_at > NOW() - INTERVAL '7 days')
  )
UNION ALL
SELECT 
  'comment' as content_type,
  id,
  LEFT(text, 100) as content_preview,
  status,
  removed_at as action_date,
  removed_reason as reason
FROM comments
WHERE status = 'removed'
  AND removed_at > NOW() - INTERVAL '7 days'
ORDER BY action_date DESC;
```

## Moderator Management

### Add a New Moderator

```sql
-- Grant moderator privileges to a user
INSERT INTO moderators (user_id, granted_by)
VALUES ('NEW_MODERATOR_USER_ID', 'YOUR_USER_ID')
ON CONFLICT (user_id) DO NOTHING;
```

### Remove Moderator Privileges

```sql
-- Revoke moderator access
UPDATE moderators
SET is_active = false
WHERE user_id = 'MODERATOR_USER_ID';
```

### List All Moderators

```sql
-- View all active moderators
SELECT 
  m.id,
  pr.username,
  pr.displayname,
  m.granted_at,
  granter.username as granted_by_username
FROM moderators m
JOIN profiles pr ON pr.user_id = m.user_id
LEFT JOIN profiles granter ON granter.user_id = m.granted_by
WHERE m.is_active = true
ORDER BY m.granted_at DESC;
```

## Best Practices

### Content Review Workflow

1. **Check Pending Posts Daily**
   - Run the "View Pending Posts" query
   - Review each post for policy violations
   - Approve or remove with reason

2. **Prioritize Reported Content**
   - Start with "View All Pending Reports"
   - Review highest-priority reports first
   - Take action and mark report as resolved

3. **Monitor User Behavior**
   - Check "Find Problematic Users" weekly
   - Look for patterns of violations
   - Consider warnings before bans

4. **Keep Audit Trail**
   - Always provide `removed_reason` when removing content
   - Mark reports as reviewed after action
   - Document decisions for accountability

### Content Moderation Guidelines

**Approve if:**
- Content follows community guidelines
- No hate speech, violence, or illegal activity
- Respects copyright and intellectual property
- Appropriate for food/restaurant content

**Remove if:**
- Spam or commercial solicitation
- Hate speech or harassment
- Violence or graphic content
- Sexual or inappropriate content
- Misinformation or false claims
- Copyright violations

**When in Doubt:**
- Err on the side of caution
- Consult with other moderators
- Document your reasoning
- Consider temporary removal while investigating

## Troubleshooting

### Post Not Showing After Approval
Check that RLS policies are correct:
```sql
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

### Users Can't Report Content
Verify reports table has correct RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'reports';
```

### Moderator Functions Not Working
Ensure you're registered as a moderator:
```sql
SELECT * FROM moderators WHERE user_id = 'YOUR_USER_ID' AND is_active = true;
```

## Need Help?

- Check RLS policies: See `supabase_ugc_rls_policies.sql`
- Review schema: See `supabase_ugc_moderation_migration.sql`
- Test queries on a copy of data first!
- Always backup before bulk operations

---

**⚠️ Important**: Always test moderation queries in a development environment first. Bulk operations cannot be undone!

