# Profile Enhancements - Database Setup Guide

This guide will help you add social features to your Crave app profiles.

## Overview

We're adding the following features to user profiles:
- **Bio** - Text description (max 500 characters)
- **Location** - User's location (max 100 characters)  
- **Instagram Handle** - Link to Instagram (max 30 characters)
- **Followers Count** - Number of users following this profile
- **Following Count** - Number of users this profile follows
- **Likes Count** - Total likes received on all posts

## Step 1: Extract Current Database Schema

First, let's see what your current database looks like:

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `db_schema_extract.sql`
4. Click **Run**
5. Save the output to a text file for reference

**Purpose**: This helps you understand your current database structure and verify everything before making changes.

## Step 2: Run the Profile Enhancements Migration

Now let's add the new features:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `supabase_profile_enhancements.sql`
3. **Review the migration** - it will:
   - Add 6 new columns to the `profiles` table
   - Create a new `followers` table for follow relationships
   - Create triggers to auto-update follower/following/likes counts
   - Create helper functions for getting profile data
4. Click **Run**

### What This Migration Does:

#### New Columns on `profiles` Table:
```sql
- bio (text, max 500 chars)
- location (text, max 100 chars)  
- instagram_handle (text, max 30 chars)
- followers_count (integer, default 0)
- following_count (integer, default 0)
- likes_count (integer, default 0)
```

#### New `followers` Table:
```sql
CREATE TABLE followers (
  follower_id uuid → who is following
  following_id uuid → who is being followed
  created_at timestamptz
)
```

#### Automatic Count Updates:
- When someone follows you → `followers_count++`
- When someone unfollows you → `followers_count--`
- When someone likes your post → `likes_count++`
- When someone unlikes your post → `likes_count--`

#### Helper Functions Created:
- `get_user_profile(username)` - Get full profile with all stats
- `is_following(follower_id, following_id)` - Check if following
- `get_followers(user_id)` - Get list of followers
- `get_following(user_id)` - Get list of following

## Step 3: Verify Migration

Run these queries in SQL Editor to verify everything worked:

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check followers table exists
SELECT * FROM followers LIMIT 5;

-- Check your profile (replace with your username)
SELECT * FROM get_user_profile('your-username-here');
```

## Step 4: Update Row Level Security (RLS) Policies

The migration already adds RLS policies for the `followers` table:
- ✅ Anyone can **view** followers/following
- ✅ Users can only **add** follows for themselves  
- ✅ Users can only **remove** follows for themselves

Make sure your existing `profiles` table has proper RLS:

```sql
-- Allow anyone to view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Step 5: Test in Your App

Your React Native profile page is already set up to display these fields! Just need to verify the data flows correctly:

1. Open your app
2. Go to **Profile** tab
3. Go to **Settings**
4. Try updating your profile info
5. Check if the new fields appear

## Database Structure Summary

### Before:
```
profiles
├── id
├── user_id
├── username
├── displayname
└── avatar_url
```

### After:
```
profiles
├── id
├── user_id
├── username
├── displayname
├── avatar_url
├── bio ⭐ NEW
├── location ⭐ NEW
├── instagram_handle ⭐ NEW
├── followers_count ⭐ NEW
├── following_count ⭐ NEW
└── likes_count ⭐ NEW

followers ⭐ NEW TABLE
├── id
├── follower_id
├── following_id
└── created_at
```

## Next Steps

After the database migration is complete, you can:

1. **Add Edit Profile Screen** - Let users update bio, location, Instagram
2. **Implement Follow/Unfollow** - Use the `followers` table
3. **Show Followers/Following Lists** - Use `get_followers()` and `get_following()`
4. **Profile Validation** - Add frontend validation for character limits

## Troubleshooting

### Error: "relation already exists"
Some tables/columns may already exist. This is safe - the migration uses `IF NOT EXISTS` checks.

### Likes count is 0 for everyone
Run this to recalculate:
```sql
UPDATE profiles p
SET likes_count = (
  SELECT COUNT(*)
  FROM likes l
  JOIN posts po ON po.id = l.post_id
  WHERE po."user" = p.user_id
);
```

### Need to rollback?
See the ROLLBACK section at the bottom of `supabase_profile_enhancements.sql`

## Important Notes

- The migration is **non-destructive** - it only adds new columns/tables
- Existing data is preserved
- All new columns are nullable, so existing profiles won't break
- Counts are automatically maintained by database triggers
- The frontend is already set up to display these fields!

---

**Questions?** Check the inline comments in `supabase_profile_enhancements.sql` for more details.

