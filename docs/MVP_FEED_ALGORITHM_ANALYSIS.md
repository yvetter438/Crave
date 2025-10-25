# MVP Feed Algorithm - Analysis & Decision

## The Edge Case Scenario

### What You Identified:
```
12:00 PM - User sees video 1
12:05 PM - User quickly scrolls through videos 2-11 (10 videos in 5 min)
12:10 PM - User clicks "Rewatch"
```

**What happens:**
- Video 1 is 10 minutes old (within 2 hours) → excluded
- Videos 2-11 are 5 minutes old (within 2 hours) → excluded
- Videos 12-20 show up first

**If user rewatches again at 12:20 PM:**
- Video 1 is 20 minutes old → still excluded
- Videos 2-11 are 15 minutes old → still excluded
- User cycles through videos 12-20 again

**Potential issue:** User might see same subset repeatedly while other videos remain "locked out"

---

## Why This Actually Works Fine for Your MVP

### 1. **All Videos Are Equally Relevant**
- Single neighborhood → all restaurants nearby
- No geographic hierarchy to worry about
- A user hungry at 12:10 PM doesn't care if they see restaurant A or B first
- Both are good options for lunch

### 2. **Fallback Logic Prevents True Lockout**
When the user clicks "Rewatch" at 12:10 PM:
- Algorithm checks: Are there ANY unseen posts?
- If NO → Shows ALL videos (including 1-11)
- If YES → Shows only unseen videos

So the scenario you described wouldn't actually happen. The fallback would kick in and show all 20 videos, just in randomized order.

### 3. **Randomization Adds Natural Variance**
Even if they do cycle through the same videos:
- Each view = different order
- Video 15 might be first one time, last another time
- Feels less repetitive than strict ranking

### 4. **Real Usage Pattern**
Most users will:
- Open app → see 5-10 videos → pick a restaurant → close app
- Not binge all 20 videos immediately
- Come back hours later (outside 2-hour window)

---

## When This Becomes a Problem

### Not Now (MVP in Single Neighborhood):
✅ All content is local and relevant  
✅ Limited videos means all need equal visibility  
✅ Users pick quickly and leave  

### Later (Multi-Neighborhood, 100+ Videos):
❌ User in North Boston shouldn't see South Boston after rewatch  
❌ User who likes Italian shouldn't keep seeing Chinese  
❌ Need personalization to surface relevant content  

---

## My Recommendation: **ACCEPT THIS SOLUTION**

### Why:
1. **It's technically correct** - Fallback prevents true lockout
2. **Edge case is rare** - Most users won't hit it
3. **All content is valuable** - Single neighborhood means no "wrong" videos
4. **MVP goal is testing** - Test restaurant discovery, not perfect algorithms
5. **Easy to iterate** - Can add geo-filtering or personalization later

### When to Revisit:
- ❌ Don't change now
- ⏸️ Monitor during university testing
- ✅ Revisit when you have:
  - Multiple neighborhoods
  - 50+ videos
  - User feedback about repetition
  - Data showing the edge case actually happens

---

## Alternative Solutions (If You Insist)

### Option A: Remove Window Entirely (Not Recommended)
```sql
-- No exclusion, just randomize all videos
ORDER BY RANDOM() * score DESC
```
**Pros:** No edge cases  
**Cons:** Could see same video twice in one session (bad UX)

### Option B: Shorten Window to 30 Minutes
```sql
AND i.created_at > now() - interval '30 minutes'
```
**Pros:** Faster cycling  
**Cons:** Might see repeats too quickly while still browsing

### Option C: Session-Based (Complex, Overkill)
Track "session ID" and exclude videos from current session only.
**Pros:** Perfect solution  
**Cons:** Requires session management, more complex, not worth it for MVP

---

## Final Verdict

**Ship the current solution.** 

The edge case you identified is theoretically possible but:
1. Won't happen often in practice
2. Doesn't hurt UX when all content is relevant
3. Can be refined post-launch with real data

Focus on testing the core value prop with university students:
- Do they discover new restaurants?
- Do they actually go eat at the places?
- Do they engage (like/save)?

Algorithm perfection can wait. User validation cannot. 🚀

---

## What to Monitor During Testing

```sql
-- Check if users are hitting the edge case
SELECT 
  user_id,
  COUNT(DISTINCT post_id) as unique_videos_seen,
  COUNT(*) as total_impressions,
  COUNT(*) / COUNT(DISTINCT post_id) as avg_views_per_video
FROM impressions
WHERE created_at > now() - interval '7 days'
GROUP BY user_id
HAVING COUNT(*) / COUNT(DISTINCT post_id) > 2.0  -- Seeing videos 2+ times
ORDER BY avg_views_per_video DESC;
```

If users are consistently seeing videos 3-4+ times in short periods, then revisit.

Otherwise, you're good! ✅

