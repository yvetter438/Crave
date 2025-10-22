# Engagement Tracking + Ranked Feed Setup Guide

## 🎯 What This Does

- **Tracks impressions**: Logs when users see videos (once per day)
- **Tracks watch time**: Records video watch events ≥2 seconds
- **Ranked feed**: Shows videos ranked by: `(likes*2 + saves*3 + watches) / (age_hours + 2)^1.5`
- **No repeats**: Excludes videos seen in the past 30 days
- **Cursor pagination**: Efficient infinite scroll

---

## 📋 Setup Steps

### Step 1: Run the Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase_migration.sql` (in your project root)
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

**Verify it worked:**
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('impressions', 'watch_events');

-- Check RPC functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_ranked_feed', 'log_impression');
```

You should see both tables and both functions listed.

---

### Step 2: Test the Feed (Optional but Recommended)

Get your user ID first:
```sql
SELECT id FROM auth.users LIMIT 1;
```

Then test the ranked feed:
```sql
SELECT * FROM get_ranked_feed(
  'YOUR-USER-ID-HERE'::uuid,  -- Replace with actual user ID
  10,                          -- Limit
  NULL                         -- No cursor for first page
);
```

**Expected result:** Should return posts ranked by engagement score.

---

### Step 3: App is Already Updated!

The following files have been modified:
- ✅ `components/VideoPost.tsx` - Now tracks impressions and watch events
- ✅ `app/(tabs)/index.tsx` - Now uses ranked feed instead of raw posts

No additional frontend changes needed!

---

## 🧪 Testing the Implementation

### Test 1: Impressions are Logged
1. Start your app
2. Scroll through 3-4 videos
3. In Supabase SQL Editor, run:
```sql
SELECT * FROM impressions 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC;
```
You should see one row per video you viewed.

### Test 2: Watch Events are Logged
1. Watch a video for 5+ seconds
2. Scroll to the next video
3. In Supabase, run:
```sql
SELECT * FROM watch_events 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 5;
```
You should see the watch event with `watch_duration_seconds ≥ 2`.

### Test 3: Feed Shows Ranked Content
1. Like and save a few videos
2. Pull to refresh the feed
3. Check console logs - you should see engagement scores in the ranking

### Test 4: No Duplicate Videos
1. Scroll through 10+ videos
2. Pull to refresh
3. The videos you just saw should NOT appear again (30-day exclusion)

---

## 🐛 Troubleshooting

### Problem: "RPC call failed: function does not exist"
**Solution:** Make sure you ran the entire SQL migration. Re-run the `CREATE FUNCTION` statements.

### Problem: "Row level security policy violation"
**Solution:** The RLS policies may not be set correctly. Re-run the policy creation section:
```sql
ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_events ENABLE ROW LEVEL SECURITY;
-- ... (re-run all the CREATE POLICY statements)
```

### Problem: "Cannot read property 'id' of null" in console
**Solution:** User is not authenticated. Make sure you're logged in before the feed loads.

### Problem: Feed is empty even though there are posts
**Solution:** 
1. Check if all posts have been "seen" (impressions logged). Try this:
```sql
DELETE FROM impressions WHERE user_id = auth.uid();
```
2. Restart the app and the feed should repopulate

### Problem: Watch events not logging
**Solution:** Make sure you're watching videos for at least 2 seconds. Watch events only log when the video pauses or you scroll away.

---

## 📊 Monitoring & Analytics

### Check Total Engagement
```sql
SELECT 
  COUNT(DISTINCT i.user_id) as total_users,
  COUNT(i.id) as total_impressions,
  COUNT(w.id) as total_watches,
  AVG(w.watch_duration_seconds) as avg_watch_time
FROM impressions i
LEFT JOIN watch_events w ON w.post_id = i.post_id;
```

### Top Performing Videos
```sql
SELECT 
  p.id,
  p.description,
  COUNT(DISTINCT l.id) as likes,
  COUNT(DISTINCT s.id) as saves,
  COUNT(DISTINCT w.id) as watches,
  COUNT(DISTINCT i.id) as impressions
FROM posts p
LEFT JOIN likes l ON l.post_id = p.id
LEFT JOIN saves s ON s.post_id = p.id
LEFT JOIN watch_events w ON w.post_id = p.id
LEFT JOIN impressions i ON i.post_id = p.id
GROUP BY p.id, p.description
ORDER BY (COUNT(l.id) * 2 + COUNT(s.id) * 3 + COUNT(w.id)) DESC
LIMIT 10;
```

### User Engagement Rate
```sql
SELECT 
  user_id,
  COUNT(DISTINCT post_id) as videos_watched,
  SUM(watch_duration_seconds) / 60 as total_minutes_watched,
  AVG(watch_duration_seconds) as avg_watch_seconds
FROM watch_events
WHERE created_at > now() - interval '7 days'
GROUP BY user_id
ORDER BY total_minutes_watched DESC;
```

---

## 🚀 What's Next?

You now have:
- ✅ Basic engagement tracking
- ✅ Ranked feed algorithm
- ✅ No repeat videos
- ✅ Efficient pagination

**Future enhancements (when you need them):**
1. **Personalization**: Weight posts by user's preferred cuisines
2. **A/B Testing**: Test different ranking formulas
3. **Materialized Views**: Pre-compute scores for faster queries (when you hit scale)
4. **Real-time Updates**: Use Supabase Realtime for live engagement metrics

---

## 📝 Notes

- Impressions are limited to once per day per user per post
- Watch events require ≥2 seconds of watch time
- The ranking formula favors recent posts with good engagement
- Feed excludes seen posts from the past 30 days
- Pull-to-refresh will get you a fresh ranked feed

**Need help?** Check the console logs - both impression and watch event logging have debug messages.

