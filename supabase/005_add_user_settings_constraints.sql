-- ============================================
-- FIX: Add unique constraint on user_settings.user_id
-- ============================================
-- This allows UPSERT operations to work with ON CONFLICT (user_id)
-- Solves error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- ============================================
-- Add unique constraint on user_id
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== Adding unique constraint on user_settings.user_id ===';
END $$;

-- Add unique constraint on user_id (NULLs are allowed for guest users)
ALTER TABLE user_settings 
  ADD CONSTRAINT user_settings_user_id_key 
  UNIQUE (user_id);

DO $$ 
BEGIN
  RAISE NOTICE '✓ Unique constraint added to user_settings.user_id';
END $$;

-- ============================================
-- Verification
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '=== Verifying constraint was added ===';
END $$;

-- Show all constraints on user_settings
SELECT 
  '=== Constraints on user_settings ===' as info;

SELECT 
  constraint_name,
  constraint_type,
  CASE constraint_type
    WHEN 'PRIMARY KEY' THEN '✓ Primary Key'
    WHEN 'UNIQUE' THEN '✓ Unique Constraint'
    WHEN 'FOREIGN KEY' THEN '✓ Foreign Key'
    ELSE constraint_type
  END as description
FROM information_schema.table_constraints
WHERE table_name = 'user_settings'
ORDER BY constraint_type, constraint_name;

-- Verify the new constraint exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'user_settings' 
        AND constraint_name = 'user_settings_user_id_key'
        AND constraint_type = 'UNIQUE'
    ) THEN '✓ SUCCESS: user_settings_user_id_key constraint exists'
    ELSE '✗ ERROR: Constraint not found'
  END as verification_result;

-- ============================================
-- SUMMARY
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  CONSTRAINT ADDED SUCCESSFULLY                             ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✓ Added UNIQUE constraint on user_settings.user_id';
  RAISE NOTICE '';
  RAISE NOTICE 'What this enables:';
  RAISE NOTICE '  ✓ UPSERT with ON CONFLICT (user_id) now works';
  RAISE NOTICE '  ✓ Each authenticated user can have only one settings row';
  RAISE NOTICE '  ✓ NULL values allowed (for guest users with device_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Restart your app (or reload)';
  RAISE NOTICE '  2. Try saving settings - should work now!';
  RAISE NOTICE '  3. No more "ON CONFLICT specification" errors';
  RAISE NOTICE '';
END $$;

-- ============================================
-- Notes
-- ============================================
-- This constraint allows:
-- 1. Multiple rows with user_id = NULL (guest users with device_id)
-- 2. Only one row per user_id (authenticated users)
-- 3. UPSERT operations: ON CONFLICT (user_id) DO UPDATE
-- 
-- The existing device_id PRIMARY KEY remains for backward compatibility
