-- ============================================
-- FIX: Apply INSERT Policy and Trigger (No CREATE TABLE)
-- ============================================
-- This script applies ONLY the fixes without trying to recreate tables
-- Safe to run on existing database with tables already created

-- ============================================
-- FIX 1: Add INSERT Policy for user_profiles
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== Applying INSERT policy fix ===';
END $$;

-- Drop any existing INSERT policies
DROP POLICY IF EXISTS "Allow trigger to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON user_profiles;

-- Create the critical INSERT policy
-- This allows the trigger to insert profiles when users sign up
CREATE POLICY "Allow profile creation on signup"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DO $$ 
BEGIN
  RAISE NOTICE '✓ INSERT policy created';
END $$;

-- ============================================
-- FIX 2: Update/Create trigger function
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== Creating/updating trigger function ===';
END $$;

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with all required defaults to prevent constraint violations
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
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate if somehow triggered twice
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ 
BEGIN
  RAISE NOTICE '✓ Trigger function created/updated';
END $$;

-- ============================================
-- FIX 3: Create/Recreate the trigger
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== Creating/recreating trigger ===';
END $$;

-- Drop if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

DO $$ 
BEGIN
  RAISE NOTICE '✓ Trigger created on auth.users';
END $$;

-- ============================================
-- FIX 4: Ensure email is nullable (if needed)
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== Ensuring email column is nullable ===';
  
  -- Check if email has NOT NULL constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' 
    AND column_name = 'email'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE user_profiles ALTER COLUMN email DROP NOT NULL;
    RAISE NOTICE '✓ Email column made nullable';
  ELSE
    RAISE NOTICE '✓ Email column already nullable';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  FIX APPLIED SUCCESSFULLY                                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- Show the policies
SELECT '=== Current policies on user_profiles ===' as verification_step;
SELECT 
  policyname,
  cmd as operation,
  CASE cmd
    WHEN 'INSERT' THEN '✓ INSERT policy (needed for signup)'
    WHEN 'SELECT' THEN '✓ SELECT policy'
    WHEN 'UPDATE' THEN '✓ UPDATE policy'
    WHEN 'DELETE' THEN '✓ DELETE policy'
  END as description
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd;

-- Show the trigger
SELECT '=== Trigger status ===' as verification_step;
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as on_table,
  CASE tgenabled
    WHEN 'O' THEN '✓ ENABLED'
    ELSE 'Disabled'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Summary
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. If you have existing users without profiles, run:';
  RAISE NOTICE '   manual_create_missing_profiles.sql';
  RAISE NOTICE '';
  RAISE NOTICE '2. Try creating a new account - it should now work!';
  RAISE NOTICE '';
  RAISE NOTICE '3. To verify, check:';
  RAISE NOTICE '   - Authentication → Users (should see user)';
  RAISE NOTICE '   - Database → user_profiles (should see matching profile)';
  RAISE NOTICE '';
END $$;
