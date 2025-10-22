-- ============================================
-- UPDATE PROFILE FIELD CHARACTER LIMITS
-- Run this to update constraints to match new limits
-- ============================================

-- Drop old constraints if they exist
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS bio_length_check,
  DROP CONSTRAINT IF EXISTS location_length_check,
  DROP CONSTRAINT IF EXISTS instagram_handle_length_check;

-- Add new constraints with updated limits
ALTER TABLE profiles
  ADD CONSTRAINT bio_length_check CHECK (char_length(bio) <= 150),
  ADD CONSTRAINT location_length_check CHECK (char_length(location) <= 150),
  ADD CONSTRAINT instagram_handle_length_check CHECK (char_length(instagram_handle) <= 30);

-- Note: displayname doesn't have a constraint yet, adding it
ALTER TABLE profiles
  ADD CONSTRAINT displayname_length_check CHECK (char_length(displayname) <= 35);

-- Verify constraints
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND constraint_name LIKE '%length_check%';

