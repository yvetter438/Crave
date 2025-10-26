-- ============================================
-- ADD ONBOARDING COMPLETION TRACKING
-- Adds column to track if user completed onboarding
-- ============================================

-- Add onboarding_completed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Don't auto-complete existing users - let them go through onboarding
-- This ensures all users have proper profiles with usernames, bios, etc.
-- Existing users will be prompted to complete their profile setup

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed);

-- Update the auto profile creation function to set onboarding as incomplete
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, displayname, onboarding_completed, created_at)
  VALUES (
    NEW.id,
    -- Generate username from email or use fallback
    COALESCE(
      LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9._]', '', 'g')),
      'user_' || SUBSTRING(NEW.id::text, 1, 8)
    ),
    -- Use email prefix as display name or fallback
    COALESCE(
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    false, -- New users need to complete onboarding
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
