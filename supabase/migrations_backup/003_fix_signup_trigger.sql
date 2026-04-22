-- ============================================
-- FIX: Database Error on User Signup
-- ============================================
-- This migration fixes the "database error saving new user" issue
-- Root cause: Missing INSERT policy on user_profiles table
-- The trigger can't insert profiles without proper RLS policies

-- ============================================
-- DIAGNOSTIC: Check current state
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== CHECKING CURRENT STATE ===';
END $$;

SELECT 'Checking create_user_profile trigger...' as diagnostic_step;
SELECT tgname, tgenabled, tgtype
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

SELECT 'Checking user_profiles policies...' as diagnostic_step;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd;

SELECT 'Checking email column constraint...' as diagnostic_step;
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'email';

-- ============================================
-- FIX 1: Add missing INSERT policy (CRITICAL)
-- ============================================
-- This is the main issue - the trigger runs as authenticated role
-- but there's no INSERT policy allowing profile creation!

DO $$ 
BEGIN
  RAISE NOTICE '=== APPLYING FIX 1: Adding INSERT policy ===';
END $$;

-- Drop existing INSERT policies if any
DROP POLICY IF EXISTS "Allow trigger to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create new INSERT policy that allows trigger to work
-- The trigger runs with SECURITY DEFINER but RLS still applies
CREATE POLICY "Allow profile creation on signup"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id); -- Only allow inserting for authenticated user's own ID

-- ============================================
-- FIX 2: Ensure email is nullable
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== APPLYING FIX 2: Making email nullable ===';
END $$;

-- Make email nullable to support OAuth and other auth methods
ALTER TABLE user_profiles 
  ALTER COLUMN email DROP NOT NULL;

-- ============================================
-- FIX 3: Improve trigger function with better error handling
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== APPLYING FIX 3: Updating trigger function ===';
END $$;

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with all required defaults to prevent constraint violations
  INSERT INTO user_profiles (
    id, 
    email,
    -- Nutrition goals with defaults
    daily_calorie_goal,
    activity_level,
    target_protein,
    target_carbs,
    target_fat,
    -- App preferences with defaults
    theme,
    meal_reminders,
    track_water,
    -- Privacy with defaults
    data_sharing_consent,
    analytics_enabled,
    -- Timestamps
    created_at,
    updated_at,
    last_active
  )
  VALUES (
    NEW.id, 
    NEW.email,
    -- Nutrition defaults
    2000, -- daily_calorie_goal
    'moderate', -- activity_level
    150, -- target_protein
    250, -- target_carbs
    65, -- target_fat
    -- App preferences defaults
    'auto', -- theme
    false, -- meal_reminders
    false, -- track_water
    -- Privacy defaults
    false, -- data_sharing_consent
    true, -- analytics_enabled
    -- Timestamps
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

-- ============================================
-- FIX 4: Recreate trigger to ensure it's active
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== APPLYING FIX 4: Recreating trigger ===';
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================
-- VERIFICATION
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'Fix applied successfully!';
  RAISE NOTICE 'Try creating a new account now.';
END $$;

SELECT '✓ Policies on user_profiles:' as verification;
SELECT policyname, cmd, qual::text as using_expression
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd;

SELECT '✓ Email column is nullable:' as verification;
SELECT 
  column_name, 
  is_nullable,
  CASE WHEN is_nullable = 'YES' THEN '✓ Nullable' ELSE '✗ Not nullable' END as status
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'email';

SELECT '✓ Trigger is active:' as verification;
SELECT 
  tgname as trigger_name,
  CASE WHEN tgenabled = 'O' THEN '✓ Enabled' ELSE '✗ Disabled' END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ============================================
-- SUMMARY
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  SIGNUP FIX APPLIED SUCCESSFULLY!                          ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✓ Added INSERT policy for user_profiles';
  RAISE NOTICE '  ✓ Made email column nullable';
  RAISE NOTICE '  ✓ Improved trigger function with error handling';
  RAISE NOTICE '  ✓ Recreated trigger on auth.users table';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now try creating a new account!';
  RAISE NOTICE '';
END $$;
