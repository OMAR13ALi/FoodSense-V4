-- ============================================
-- QUICK CHECK: 30-second verification
-- ============================================
-- Run this anytime to quickly check if profiles are being created

-- Show user count vs profile count
SELECT 
  '=== Quick Status ===' as check,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM user_profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM user_profiles) as missing,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM user_profiles)
    THEN '✓ All users have profiles'
    ELSE '✗ Some users missing profiles - run manual_create_missing_profiles.sql'
  END as status;

-- Show INSERT policy status
SELECT 
  '=== INSERT Policy ===' as check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND cmd = 'INSERT')
    THEN '✓ INSERT policy exists'
    ELSE '✗ INSERT policy MISSING - run 004_apply_insert_policy_only.sql'
  END as status;

-- Show trigger status
SELECT 
  '=== Trigger ===' as check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgenabled = 'O')
    THEN '✓ Trigger exists and enabled'
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '⚠ Trigger exists but disabled'
    ELSE '✗ Trigger MISSING - run 004_apply_insert_policy_only.sql'
  END as status;

-- Show recent users and their profiles
SELECT 
  '=== Recent Users ===' as info,
  u.email,
  CASE WHEN p.id IS NOT NULL THEN '✓ Has profile' ELSE '✗ No profile' END as profile_status,
  u.created_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
