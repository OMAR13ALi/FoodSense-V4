# ✅ READY TO APPLY: User Profile Fix

## Current Status

**Problem:** Users created in Authentication but profiles NOT created in database

**Solution:** SQL scripts are ready and **syntax errors have been fixed**

**What was fixed:** Moved `RAISE NOTICE` statements into proper `DO $$ ... END $$` blocks

---

## Apply the Fix Now (3 Steps)

### 1️⃣ Open Supabase SQL Editor

Go to: **Supabase Dashboard → SQL Editor**
URL: https://supabase.com/dashboard

---

### 2️⃣ Run Script 1: Check Current State

📁 **File:** `debug_check_user_profile.sql`

**Action:**
1. Open the file in your editor
2. Copy **ALL contents** (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **RUN** or press `Ctrl+Enter`

**Expected Output:**
- Shows how many users exist
- Shows how many profiles exist
- Shows orphaned users (users without profiles)
- Shows if INSERT policy exists (should say "MISSING")
- Shows if trigger exists

---

### 3️⃣ Run Script 2: Apply the Fix

📁 **File:** `004_apply_insert_policy_only.sql`

**Action:**
1. Open the file in your editor
2. Copy **ALL contents**
3. Paste into Supabase SQL Editor
4. Click **RUN**

**Expected Output:**
```
=== Applying INSERT policy fix ===
✓ INSERT policy created
=== Creating/updating trigger function ===
✓ Trigger function created/updated
=== Creating/recreating trigger ===
✓ Trigger created on auth.users
✓ Email column already nullable
╔════════════════════════════════════════╗
║  FIX APPLIED SUCCESSFULLY              ║
╚════════════════════════════════════════╝
```

---

### 4️⃣ Run Script 3: Create Missing Profiles

📁 **File:** `manual_create_missing_profiles.sql`

**Action:**
1. Open the file in your editor
2. Copy **ALL contents**
3. Paste into Supabase SQL Editor
4. Click **RUN**

**Expected Output:**
```
=== Creating missing profiles ===
✓ Created 1 profile(s)

╔════════════════════════════════════════╗
║  PROFILE CREATION COMPLETE             ║
╚════════════════════════════════════════╝

✓ SUCCESS: All users now have profiles!
```

---

## Verify It Worked

### In Supabase Dashboard:

1. **Database → Tables → user_profiles**
   - Click to view table
   - You should see your user's profile with:
     - Their user ID
     - Their email
     - Default values (2000 cal, moderate activity, etc.)

2. **Authentication → Users**
   - User should still be there (unchanged)

### Test with New Signup:

1. In your app, create a **brand new account** (different email)
2. Check **Database → user_profiles** immediately
3. New profile should appear **automatically** 🎉

---

## What Each Script Does

| Script | Purpose | Changes Database |
|--------|---------|------------------|
| `debug_check_user_profile.sql` | Check current state | ❌ No (read-only) |
| `004_apply_insert_policy_only.sql` | Fix trigger system | ✅ Yes (adds policy + trigger) |
| `manual_create_missing_profiles.sql` | Create missing profiles | ✅ Yes (inserts profiles) |

---

## Quick Verification Script

After running all 3 scripts, run this to verify everything:

📁 **File:** `quick_check.sql`

**Shows:**
- ✓ Number of users vs profiles (should match)
- ✓ INSERT policy status (should exist)
- ✓ Trigger status (should be enabled)
- ✓ Recent users and their profile status

---

## Troubleshooting

### "syntax error at or near RAISE"
**Fixed!** The scripts have been updated. Re-copy the file contents.

### "relation user_profiles already exists"
Don't run `003_fix_signup_trigger.sql` - use `004_apply_insert_policy_only.sql` instead.

### "permission denied"
Make sure you're logged into Supabase Dashboard with the project owner account.

### Still no profiles after running scripts
1. Check for error messages in the SQL Editor output
2. Run `debug_check_user_profile.sql` again to see current state
3. Check **Supabase Logs → Database** for trigger errors

---

## Next Steps After Fix

Once all 3 scripts succeed:

1. ✅ Existing users now have profiles
2. ✅ Future signups will automatically create profiles
3. ✅ No more "database error saving new user"

**You're done!** The signup flow should now work perfectly. 🚀

---

## Need More Help?

See `HOW_TO_FIX_MISSING_PROFILES.md` for:
- Detailed explanations
- Default values used
- Advanced troubleshooting
- Understanding the fix
