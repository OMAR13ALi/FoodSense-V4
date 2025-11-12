-- ============================================
-- MANUAL FIX: Create Profiles for Existing Users
-- ============================================
-- This script creates profiles for users that exist in auth.users
-- but don't have a corresponding row in user_profiles
-- Run this AFTER applying 004_apply_insert_policy_only.sql

-- ============================================
-- Step 1: Show users that need profiles
-- ============================================
SELECT '=== Users without profiles ===' as step;

SELECT 
  u.id,
  u.email,
  u.created_at,
  '→ Will create profile' as action
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- ============================================
-- Step 2: Create missing profiles
-- ============================================
DO $$ 
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '=== Creating missing profiles ===';
  
  -- Insert profiles for all users without one
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
    2000, -- daily_calorie_goal (default)
    'moderate', -- activity_level (default)
    150, -- target_protein (default)
    250, -- target_carbs (default)
    65, -- target_fat (default)
    'auto', -- theme (default)
    false, -- meal_reminders
    false, -- track_water
    false, -- data_sharing_consent
    true, -- analytics_enabled
    NOW(),
    NOW(),
    NOW()
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING; -- Skip if somehow already exists
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RAISE NOTICE '';
  RAISE NOTICE '✓ Created % profile(s)', v_count;
  RAISE NOTICE '';
END $$;

-- ============================================
-- Step 3: Verify all users now have profiles
-- ============================================
SELECT '=== Verification ===' as step;

SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.id) as total_profiles,
  COUNT(DISTINCT u.id) - COUNT(DISTINCT p.id) as missing_profiles
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id;

-- Show detailed verification
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ All users have profiles!'
    ELSE '✗ Still missing profiles for ' || COUNT(*) || ' users'
  END as verification_result
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- ============================================
-- Step 4: Show created profiles
-- ============================================
SELECT '=== Recently created profiles ===' as step;

SELECT 
  up.id,
  up.email,
  up.daily_calorie_goal,
  up.activity_level,
  up.created_at,
  '✓ Profile exists' as status
FROM user_profiles up
ORDER BY up.created_at DESC
LIMIT 10;

-- ============================================
-- SUMMARY
-- ============================================
DO $$ 
DECLARE
  v_orphaned INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_orphaned
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  PROFILE CREATION COMPLETE                                 ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
  IF v_orphaned = 0 THEN
    RAISE NOTICE '✓ SUCCESS: All users now have profiles!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to your app and log in with the existing account';
    RAISE NOTICE '2. Or try creating a new account to test the trigger';
    RAISE NOTICE '3. Verify profile appears in Database → user_profiles';
  ELSE
    RAISE NOTICE '⚠ WARNING: Still % user(s) without profiles', v_orphaned;
    RAISE NOTICE 'Check the error messages above for details';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- Optional: Show user-profile matching
-- ============================================
SELECT '=== User to Profile Mapping ===' as optional_info;

SELECT 
  u.email as auth_email,
  p.email as profile_email,
  u.created_at as user_created,
  p.created_at as profile_created,
  CASE 
    WHEN p.id IS NOT NULL THEN '✓ Matched'
    ELSE '✗ No profile'
  END as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
