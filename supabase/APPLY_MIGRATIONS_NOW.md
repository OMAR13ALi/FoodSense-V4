# 🚨 CRITICAL: Fix Authentication & Profile Creation Issue

## The Problem
Users can sign up successfully but profiles aren't created in `user_profiles` table, causing the app to get stuck on loading screen.

## The Solution
Apply migration 003 and manually create missing profiles for existing users.

---

## Step 1: Apply Migration 004 in Supabase Dashboard

### ⚠️ IMPORTANT: Use Migration 004, NOT 003

Since the policy from migration 003 already exists, we need to use migration 004 instead, which:
- Works with existing policies
- Fixes the trigger function
- Creates profiles for existing orphaned users

### Instructions:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `calorie-app`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste Migration 004**
   - Open file: `supabase/migrations/004_fix_existing_users.sql`
   - Copy ALL contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button (or press Ctrl+Enter / Cmd+Enter)
   - Wait for execution to complete
   - Check for success messages in the output

5. **Verify Success**
   - You should see verification output showing:
     - Number of profiles created for orphaned users
     - ✓ All users have profiles
     - ✓ Trigger is active
   - Look for "FIX APPLIED SUCCESSFULLY!" message

---

## Step 2: Verify Fix (Migration 004 does this automatically!)

Migration 004 automatically creates profiles for existing orphaned users. You can verify it worked:

### Check all users have profiles:

Run this query in SQL Editor to verify:

```sql
-- Verify all users now have profiles
SELECT
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as missing_profiles
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id;
```

**Expected output:** `missing_profiles` should be `0`

If you still see missing profiles, run this manually:

```sql
-- Manually create any remaining missing profiles
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
  2000, 'moderate', 150, 250, 65,
  'auto', false, false, false, true,
  NOW(), NOW(), NOW()
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

---

## Step 3: Test the Fix

### Test new user signup:

1. **Clear app data** (or use a new device/emulator)
2. **Sign up with new email** (e.g., `test-new@example.com`)
3. **Check if profile was created automatically:**

```sql
-- Check the newly created user
SELECT
  u.id,
  u.email,
  u.created_at,
  p.id as profile_id,
  p.daily_calorie_goal,
  CASE
    WHEN p.id IS NOT NULL THEN '✓ Profile Created Automatically!'
    ELSE '❌ Profile Still Missing - Migration Failed'
  END as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.email = 'test-new@example.com';
```

### Test existing user login:

1. **Log in with existing user**
2. **App should load successfully** (no stuck loading screen)
3. **Navigate to tabs** - should work normally

---

## Expected Results After Applying Fix

✅ **New signups:** Profile automatically created via trigger
✅ **Existing users:** Profiles manually created, can log in
✅ **App loading:** No more stuck on loading screen
✅ **Database:** All users have corresponding profiles

---

## Troubleshooting

### If migration 003 fails:

**Error: "policy already exists"**
- This is OK! It means the policy was already created
- Continue with next steps

**Error: "permission denied"**
- Make sure you're using the Supabase dashboard SQL Editor
- You need admin/service_role privileges

**Error: "column does not exist"**
- Migration 002 might not have been applied
- Apply migration 002 first, then 003

### If profiles still not created on signup:

1. Check trigger is enabled:
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

2. Check INSERT policy exists:
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles' AND cmd = 'INSERT';
```

3. Check for errors in Supabase logs:
   - Dashboard → Logs → Select "Postgres Logs"
   - Look for warnings about profile creation

---

## Next Steps After Database Fix

The app code will also be updated with:
1. Profile validation in auth service
2. Automatic profile creation fallback
3. Better error handling for missing profiles

This provides a safety net in case the trigger ever fails.

---

## Questions?

If you encounter issues:
1. Check Supabase dashboard logs
2. Run the verification queries above
3. Make sure both migration 002 and 003 are applied
