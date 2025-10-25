# 🗄️ SQL Scripts & Migrations

This folder contains all SQL scripts, migrations, and database-related files.

## 🏗️ Initial Setup & Schema
- [`supabase_migration.sql`](./supabase_migration.sql) - Initial database migration
- [`db_schema_extract.sql`](./db_schema_extract.sql) - Schema extraction script
- [`database_analysis.sql`](./database_analysis.sql) - Database analysis queries

## 👤 Profile & User Management
- [`supabase_profile_enhancements.sql`](./supabase_profile_enhancements.sql) - Profile table enhancements
- [`update_profile_limits.sql`](./update_profile_limits.sql) - Profile field limits
- [`verify_profile_migration.sql`](./verify_profile_migration.sql) - Profile migration verification
- [`fix_followers_functions.sql`](./fix_followers_functions.sql) - Follow system fixes

## 💬 Comments System
- [`supabase_comments_migration.sql`](./supabase_comments_migration.sql) - Comments table setup
- [`check_comment_functions.sql`](./check_comment_functions.sql) - Comment function verification
- [`comment_diagnostic.sql`](./comment_diagnostic.sql) - Comment system diagnostics
- [`fix_comment_counter.sql`](./fix_comment_counter.sql) - Comment counting fixes
- [`fix_comments_status.sql`](./fix_comments_status.sql) - Comment status fixes
- [`fix_comments_user_relationship.sql`](./fix_comments_user_relationship.sql) - User relationship fixes
- [`simple_comments_check.sql`](./simple_comments_check.sql) - Basic comment checks

## 🛡️ Moderation & UGC
- [`supabase_add_moderator_columns.sql`](./supabase_add_moderator_columns.sql) - Moderator system setup
- [`supabase_enhanced_ugc_moderation.sql`](./supabase_enhanced_ugc_moderation.sql) - Enhanced moderation
- [`supabase_ugc_moderation_migration.sql`](./supabase_ugc_moderation_migration.sql) - UGC moderation setup
- [`supabase_ugc_moderation_fix.sql`](./supabase_ugc_moderation_fix.sql) - Moderation fixes
- [`supabase_ugc_rls_policies.sql`](./supabase_ugc_rls_policies.sql) - Row Level Security policies

## 📊 Feed Algorithm & Performance
- [`supabase_feed_algorithm_v1.sql`](./supabase_feed_algorithm_v1.sql) - Feed algorithm implementation
- [`supabase_feed_simple_moderation.sql`](./supabase_feed_simple_moderation.sql) - Feed moderation
- [`supabase_offset_pagination_fix.sql`](./supabase_offset_pagination_fix.sql) - Pagination improvements
- [`supabase_seeded_random_fix.sql`](./supabase_seeded_random_fix.sql) - Random feed fixes

## 🔐 Security & Permissions
- [`check_rls_policies.sql`](./check_rls_policies.sql) - RLS policy verification
- [`fix_profiles_rls_policies.sql`](./fix_profiles_rls_policies.sql) - Profile RLS fixes
- [`supabase_storage_policies_fix.sql`](./supabase_storage_policies_fix.sql) - Storage policy fixes

## 🔧 Bug Fixes & Diagnostics
- [`fix_ambiguous_column.sql`](./fix_ambiguous_column.sql) - Column ambiguity fixes
- [`fix_data_type_mismatch.sql`](./fix_data_type_mismatch.sql) - Data type corrections

## 📝 Usage Notes

**Running Scripts:**
```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f script_name.sql
```

**Script Order:**
1. Run setup scripts first (`supabase_migration.sql`)
2. Apply feature-specific migrations
3. Run fixes and diagnostics as needed
4. Verify with check scripts

**⚠️ Important:**
- Always backup your database before running migration scripts
- Test scripts on a development database first
- Some scripts may need to be run in a specific order due to dependencies
