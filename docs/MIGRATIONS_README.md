# Database Migrations

## Setup Order (Run in Supabase SQL Editor)

### Step 1: Initial Setup
Run `supabase_migration.sql` to create:
- `impressions` table
- `watch_events` table
- `log_impression` helper function
- RLS policies

### Step 2: Feed Algorithm (Current/Active)
Run `supabase_seeded_random_fix.sql` to create:
- `get_ranked_feed_offset` function (with seeded randomization)
- This is the ACTIVE version used by the app

## Historical Files (Reference Only)
- `supabase_feed_algorithm_v1.sql` - First iteration (cursor-based, deprecated)
- `supabase_offset_pagination_fix.sql` - Second iteration (offset without seed, had duplicate bug)

These are kept for documentation purposes but should NOT be run.

## Testing

After running migrations, verify:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('impressions', 'watch_events');

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_ranked_feed_offset', 'log_impression');
```

## Rollback (if needed)
```sql
DROP FUNCTION IF EXISTS get_ranked_feed_offset(uuid, integer, integer, double precision);
DROP FUNCTION IF EXISTS log_impression(uuid, bigint);
DROP TABLE IF EXISTS watch_events;
DROP TABLE IF EXISTS impressions;
```


