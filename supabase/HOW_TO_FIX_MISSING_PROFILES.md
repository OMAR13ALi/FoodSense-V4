# How to Fix Missing User Profiles

## Problem
- Users are created in **Authentication → Users** (`auth.users`)
- BUT profiles are NOT created in **Database → user_profiles**
- The `create_user_profile()` trigger is not working

## Root Cause
The trigger can't insert into `user_profiles` because the **INSERT policy is missing** on the table.

---

## Quick Fix (3 Steps)

### Step 1: Run Diagnostic Script
This shows you the current state of your database.

1. Go to **Supabase Dashboard → SQL Editor**
2. Open file: `debug_check_user_profile.sql`
3. Copy **entire contents** and paste into SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. Review the results:
   - How many orphaned users (users without profiles)
   - Whether INSERT policy exists
   - Whether trigger exists

**Expected Output:**
```
Orphaned users: 1 or more
INSERT policy exists: NO - PROBLEM!
Trigger exists: YES or NO
```

---

### Step 2: Apply the Fix
This creates the INSERT policy and ensures the trigger is working.

1. Still in **Supabase Dashboard → SQL Editor**
2. Open file: `004_apply_insert_policy_only.sql`
3. Copy **entire contents** and paste into SQL Editor
4. Click **Run**
5. Look for success message: `✓ FIX APPLIED SUCCESSFULLY`

**What this does:**
- ✅ Creates INSERT policy on `user_profiles`
- ✅ Updates/creates the `create_user_profile()` function
- ✅ Creates the trigger on `auth.users`
- ✅ Makes email column nullable (if needed)

---

### Step 3: Create Profiles for Existing Users
This manually creates profiles for users that already exist.

1. Still in **Supabase Dashboard → SQL Editor**
2. Open file: `manual_create_missing_profiles.sql`
3. Copy **entire contents** and paste into SQL Editor
4. Click **Run**
5. Look for: `✓ SUCCESS: All users now have profiles!`

**What this does:**
- Finds all users in `auth.users` without profiles
- Creates profiles for them with default values
- Verifies all users now have profiles

---

## Verify the Fix

### Check in Supabase Dashboard

1. **Authentication → Users**
   - You should see your user(s)
   
2. **Database → user_profiles table**
   - You should see matching profile(s) with same user ID

### Test with New Signup

1. In your app, create a **new account** (different email)
2. After signup, check:
   - **Authentication → Users**: New user should appear
   - **Database → user_profiles**: New profile should appear **immediately**

If the profile appears immediately, the fix worked! 🎉

---

## What Each Script Does

### 1. `debug_check_user_profile.sql` (Diagnostic)
**Purpose:** Understand what's wrong

**Checks:**
- ✓ Users in `auth.users`
- ✓ Profiles in `user_profiles`
- ✓ Orphaned users (users without profiles)
- ✓ Trigger existence and status
- ✓ INSERT policy existence
- ✓ RLS status

**Safe to run:** Yes, read-only

---

### 2. `004_apply_insert_policy_only.sql` (Fix)
**Purpose:** Fix the trigger so future signups work

**Does:**
- Creates INSERT policy on `user_profiles`
- Updates trigger function with better error handling
- Recreates trigger on `auth.users`
- Makes email nullable

**Safe to run:** Yes, idempotent (can run multiple times)

---

### 3. `manual_create_missing_profiles.sql` (Cleanup)
**Purpose:** Create profiles for existing users

**Does:**
- Finds users without profiles
- Creates profiles with default values:
  - `daily_calorie_goal`: 2000
  - `activity_level`: moderate
  - `target_protein`: 150g
  - `target_carbs`: 250g
  - `target_fat`: 65g
  - `theme`: auto

**Safe to run:** Yes, uses `ON CONFLICT DO NOTHING`

---

## Troubleshooting

### Issue: "relation user_profiles already exists"
**Solution:** Don't run `003_fix_signup_trigger.sql` (it tries to CREATE TABLE)
Use `004_apply_insert_policy_only.sql` instead (just the fixes)

### Issue: Still no profiles after running scripts
**Check:**
1. Did all 3 scripts run successfully?
2. Any error messages in Supabase logs?
3. Run diagnostic script again to check status

### Issue: "permission denied for table user_profiles"
**Cause:** You're logged in as wrong user in SQL Editor
**Solution:** Make sure you're running as database admin (default in Supabase Dashboard)

### Issue: Email confirmation required
If Supabase requires email confirmation:
1. Go to **Authentication → Settings → Email Auth**
2. Turn OFF "Enable email confirmations" (for development)
3. Try signup again

---

## Default Values Explanation

When profiles are created (automatically or manually), these defaults are used:

| Field | Default | Why |
|-------|---------|-----|
| `daily_calorie_goal` | 2000 | Average adult recommendation |
| `activity_level` | moderate | Most common activity level |
| `target_protein` | 150g | Moderate protein target |
| `target_carbs` | 250g | Balanced diet |
| `target_fat` | 65g | Healthy fat intake |
| `theme` | auto | Follow system theme |
| `meal_reminders` | false | Opt-in feature |
| `track_water` | false | Opt-in feature |
| `data_sharing_consent` | false | Privacy first |
| `analytics_enabled` | true | Help improve app |

Users can change these in the app settings later.

---

## After the Fix

Once you've run all 3 scripts:

✅ **Existing users** now have profiles
✅ **New signups** will automatically get profiles
✅ **Trigger is working** properly
✅ **INSERT policy exists** to allow profile creation

You should be good to go! 🚀

---

## Questions?

If you still have issues:
1. Check Supabase logs: **Logs → Database**
2. Look for trigger warnings/errors
3. Run diagnostic script again to see current state
4. Check if RLS is blocking operations
