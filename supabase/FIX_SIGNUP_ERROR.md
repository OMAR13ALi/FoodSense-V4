# Fix: Database Error on User Signup

## Problem
When creating a new account, you get: **"database error saving new user"**

## Root Cause
The `user_profiles` table was missing an **INSERT policy** for Row Level Security (RLS). When a new user signs up, the trigger `create_user_profile()` tries to insert a row into `user_profiles`, but RLS blocks it because there's no policy allowing INSERT operations.

## Solution

### Option 1: Run the Quick Fix Script (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project at https://supabase.com/dashboard
   - Navigate to **SQL Editor**

2. **Run the Fix Script**
   - Copy the entire contents of `migrations/003_fix_signup_trigger.sql`
   - Paste into SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Success**
   - Look for the success message at the bottom
   - You should see diagnostics and verification results

4. **Test Signup**
   - Go to your app
   - Try creating a new account
   - Should work now! ✓

### Option 2: Manual Fix (If you prefer step-by-step)

Run these SQL commands in Supabase SQL Editor one at a time:

```sql
-- 1. Add the missing INSERT policy
CREATE POLICY "Allow profile creation on signup"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Verify it was created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

That's it! The INSERT policy is the critical fix.

## What Changed

### Before (Broken)
```sql
-- user_profiles had only SELECT and UPDATE policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT ...
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE ...
-- ❌ NO INSERT POLICY!
```

### After (Fixed)
```sql
-- Added INSERT policy
CREATE POLICY "Allow profile creation on signup"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
-- ✅ Now the trigger can insert profiles!
```

## Additional Improvements in the Fix

The fix script also includes:

1. **Better error handling** - Trigger won't crash if profile creation fails
2. **Explicit defaults** - Sets all required fields to prevent constraint violations
3. **Diagnostics** - Shows current state before applying fixes
4. **Verification** - Confirms the fix was applied correctly

## Testing

After applying the fix:

1. ✅ Try creating a new account with email/password
2. ✅ Check that you're redirected to the main app
3. ✅ Verify profile was created in Supabase:
   ```sql
   SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 5;
   ```

## If It Still Doesn't Work

Check the following:

1. **RLS is enabled**: `SELECT tablename FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true;`
2. **Trigger exists**: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
3. **Policy exists**: `SELECT * FROM pg_policies WHERE tablename = 'user_profiles' AND cmd = 'INSERT';`
4. **Check Supabase logs** in Dashboard → Logs → Database for actual error messages

## Future Database Setup

The migration file `002_add_auth_and_profiles.sql` has been updated with the fix, so future database setups will have the correct INSERT policy from the start.
