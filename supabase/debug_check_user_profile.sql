-- ============================================
-- DIAGNOSTIC: Check User Profile Creation Status
-- ============================================
-- Run this first to understand what's happening

-- ============================================
-- 1. Check users in auth.users
-- ============================================
SELECT '=== STEP 1: Users in auth.users ===' as diagnostic_step;

SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✓ Email confirmed'
    ELSE '✗ Email NOT confirmed'
  END as confirmation_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

SELECT 
  COUNT(*) as total_auth_users
FROM auth.users;

-- ============================================
-- 2. Check profiles in user_profiles
-- ============================================
SELECT '=== STEP 2: Profiles in user_profiles ===' as diagnostic_step;

SELECT 
  id,
  email,
  created_at,
  daily_calorie_goal
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;

SELECT 
  COUNT(*) as total_profiles
FROM user_profiles;

-- ============================================
-- 3. CRITICAL: Find orphaned users (users without profiles)
-- ============================================
SELECT '=== STEP 3: ORPHANED USERS (Need Manual Fix) ===' as diagnostic_step;

SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  '✗ NO PROFILE EXISTS' as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

SELECT 
  COUNT(*) as orphaned_users_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠ These users need profiles created manually!'
    ELSE '✓ All users have profiles'
  END as action_needed
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- ============================================
-- 4. Check if trigger exists and is enabled
-- ============================================
SELECT '=== STEP 4: Trigger Status ===' as diagnostic_step;

SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled_status,
  CASE tgenabled
    WHEN 'O' THEN '✓ Enabled'
    WHEN 'D' THEN '✗ Disabled'
    ELSE 'Unknown'
  END as human_readable_status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- If no rows returned, trigger doesn't exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '✓ Trigger exists'
    ELSE '✗ TRIGGER MISSING - Need to create it!'
  END as trigger_existence;

-- ============================================
-- 5. Check if trigger function exists
-- ============================================
SELECT '=== STEP 5: Trigger Function Status ===' as diagnostic_step;

SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name = 'create_user_profile' THEN '✓ Function exists'
    ELSE 'Unknown'
  END as status
FROM information_schema.routines
WHERE routine_name = 'create_user_profile';

-- ============================================
-- 6. Check RLS policies on user_profiles
-- ============================================
SELECT '=== STEP 6: RLS Policies on user_profiles ===' as diagnostic_step;

SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd;

-- Check specifically for INSERT policy
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_profiles' AND cmd = 'INSERT'
    )
    THEN '✓ INSERT policy exists'
    ELSE '✗ INSERT POLICY MISSING - This is likely the problem!'
  END as insert_policy_status;

-- ============================================
-- 7. Check if RLS is enabled on user_profiles
-- ============================================
SELECT '=== STEP 7: RLS Status ===' as diagnostic_step;

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✓ RLS is enabled'
    ELSE '✗ RLS is disabled'
  END as status
FROM pg_tables
WHERE tablename = 'user_profiles';

-- ============================================
-- SUMMARY
-- ============================================
SELECT '=== DIAGNOSTIC SUMMARY ===' as summary;

DO $$ 
DECLARE
  v_orphaned_count INTEGER;
  v_has_insert_policy BOOLEAN;
  v_has_trigger BOOLEAN;
BEGIN
  -- Count orphaned users
  SELECT COUNT(*) INTO v_orphaned_count
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  -- Check INSERT policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' AND cmd = 'INSERT'
  ) INTO v_has_insert_policy;
  
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) INTO v_has_trigger;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  DIAGNOSTIC RESULTS                                        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Orphaned users (no profile): %', v_orphaned_count;
  RAISE NOTICE 'INSERT policy exists: %', CASE WHEN v_has_insert_policy THEN 'YES' ELSE 'NO - PROBLEM!' END;
  RAISE NOTICE 'Trigger exists: %', CASE WHEN v_has_trigger THEN 'YES' ELSE 'NO - PROBLEM!' END;
  RAISE NOTICE '';
  
  IF v_orphaned_count > 0 THEN
    RAISE NOTICE '⚠ ACTION REQUIRED:';
    RAISE NOTICE '  Run manual_create_missing_profiles.sql to fix existing users';
  END IF;
  
  IF NOT v_has_insert_policy OR NOT v_has_trigger THEN
    RAISE NOTICE '⚠ ACTION REQUIRED:';
    RAISE NOTICE '  Run 004_apply_insert_policy_only.sql to fix trigger';
  END IF;
  
  IF v_orphaned_count = 0 AND v_has_insert_policy AND v_has_trigger THEN
    RAISE NOTICE '✓ Everything looks good!';
  END IF;
  
  RAISE NOTICE '';
END $$;
