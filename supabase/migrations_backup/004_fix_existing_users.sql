-- ============================================
-- FIX: Create Missing Profiles for Existing Users
-- ============================================
-- This migration:
-- 1. Checks the trigger is working properly
-- 2. Recreates the trigger function with better error handling
-- 3. Creates profiles for any existing users without them

-- ============================================
-- CHECK CURRENT STATE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== CHECKING CURRENT STATE ===';
END $$;

-- Check for users without profiles (orphaned users)
SELECT
  'Found ' || COUNT(*) || ' users without profiles' as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Show existing policies
SELECT 'Current INSERT policies on user_profiles:' as info;
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles' AND cmd = 'INSERT';

-- Check trigger status
SELECT 'Trigger status:' as info;
SELECT
  tgname as trigger_name,
  CASE WHEN tgenabled = 'O' THEN '✓ Enabled' ELSE '✗ Disabled' END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- ============================================
-- FIX 1: Ensure email is nullable
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== FIX 1: Making email nullable ===';
END $$;

-- Make email nullable to support all auth methods
ALTER TABLE user_profiles
  ALTER COLUMN email DROP NOT NULL;

-- ============================================
-- FIX 2: Recreate trigger function with better error handling
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== FIX 2: Updating trigger function ===';
END $$;

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the attempt
  RAISE NOTICE 'Creating profile for user: %', NEW.id;

  -- Insert profile with all required defaults
  INSERT INTO user_profiles (
    id,
    email,
    daily_calorie_goal,
    activity_level,
    target_protein,
    target_carbs,
    target_fat,
    theme,
    meal_reminders,
    track_water,
    data_sharing_consent,
    analytics_enabled,
    created_at,
    updated_at,
    last_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    2000, -- daily_calorie_goal
    'moderate', -- activity_level
    150, -- target_protein
    250, -- target_carbs
    65, -- target_fat
    'auto', -- theme
    false, -- meal_reminders
    false, -- track_water
    false, -- data_sharing_consent
    true, -- analytics_enabled
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate errors

  RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile for user %: % (SQLSTATE: %)',
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIX 3: Ensure trigger is active
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== FIX 3: Ensuring trigger is active ===';
END $$;

-- Drop and recreate trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================
-- FIX 4: Create profiles for existing orphaned users
-- ============================================
DO $$
DECLARE
  v_user_count INTEGER;
BEGIN
  RAISE NOTICE '=== FIX 4: Creating missing profiles ===';

  -- Create profiles for all users that don't have them
  INSERT INTO user_profiles (
    id,
    email,
    daily_calorie_goal,
    activity_level,
    target_protein,
    target_carbs,
    target_fat,
    theme,
    meal_reminders,
    track_water,
    data_sharing_consent,
    analytics_enabled,
    created_at,
    updated_at,
    last_active
  )
  SELECT
    u.id,
    u.email,
    2000, -- daily_calorie_goal
    'moderate', -- activity_level
    150, -- target_protein
    250, -- target_carbs
    65, -- target_fat
    'auto', -- theme
    false, -- meal_reminders
    false, -- track_water
    false, -- data_sharing_consent
    true, -- analytics_enabled
    NOW(),
    NOW(),
    NOW()
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.id
  WHERE p.id IS NULL; -- Only create for users without profiles

  GET DIAGNOSTICS v_user_count = ROW_COUNT;

  RAISE NOTICE 'Created % missing profiles', v_user_count;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';
END $$;

-- Check if all users now have profiles
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ All users have profiles!'
    ELSE '✗ Still ' || COUNT(*) || ' users without profiles'
  END as verification_status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Show total counts
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM user_profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users u LEFT JOIN user_profiles p ON u.id = p.id WHERE p.id IS NULL) as missing_profiles;

-- ============================================
-- TEST THE TRIGGER (Optional - uncomment to test)
-- ============================================
-- This section can be used to test if the trigger works
-- Uncomment to create a test user and see if profile is created

/*
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  RAISE NOTICE '=== TESTING TRIGGER ===';
  RAISE NOTICE 'You can now try signing up with a new user to test the trigger.';
  RAISE NOTICE 'Or run this query to see if profiles are being created:';
  RAISE NOTICE 'SELECT u.id, u.email, p.id as profile_id FROM auth.users u LEFT JOIN user_profiles p ON u.id = p.id;';
END $$;
*/

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  FIX APPLIED SUCCESSFULLY!                                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✓ Made email column nullable';
  RAISE NOTICE '  ✓ Updated trigger function with better logging';
  RAISE NOTICE '  ✓ Recreated trigger on auth.users';
  RAISE NOTICE '  ✓ Created profiles for existing users';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Try logging in with an existing user';
  RAISE NOTICE '  2. Try signing up with a new user';
  RAISE NOTICE '  3. App should no longer get stuck on loading';
  RAISE NOTICE '';
END $$;
