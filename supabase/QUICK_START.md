# Quick Start: Fix Missing User Profiles

## The Problem You're Experiencing

✅ User created in **Authentication → Users**  
❌ Profile NOT created in **Database → user_profiles**  

---

## ⚠️ IMPORTANT: SQL Scripts Fixed!

The SQL scripts had syntax errors that have been **fixed**. You can now safely run them.

**What was fixed:** Moved all `RAISE NOTICE` statements into proper `DO $$ ... END $$` blocks.

---

## The Solution (3 Minutes)

### Copy & Paste These 3 Scripts into Supabase SQL Editor

Go to: **Supabase Dashboard → SQL Editor**

---

#### Script 1: Check Current State
📁 File: `debug_check_user_profile.sql`

```sql
-- Copy entire file contents and paste into SQL Editor
-- Click Run
-- Review the diagnostics
```

Expected output: Shows orphaned users, missing policies

---

#### Script 2: Apply the Fix
📁 File: `004_apply_insert_policy_only.sql`

```sql
-- Copy entire file contents and paste into SQL Editor
-- Click Run
-- Look for: ✓ FIX APPLIED SUCCESSFULLY
```

This fixes the trigger for future signups.

---

#### Script 3: Create Missing Profiles
📁 File: `manual_create_missing_profiles.sql`

```sql
-- Copy entire file contents and paste into SQL Editor
-- Click Run
-- Look for: ✓ SUCCESS: All users now have profiles!
```

This creates profiles for existing users.

---

## Verify It Worked

1. Check **Database → user_profiles table**
   - Should now see your user's profile

2. Try creating a **new account** in the app
   - Profile should appear immediately in database

3. You're done! 🎉

---

## Files Overview

| File | Purpose | Safe to Run |
|------|---------|-------------|
| `debug_check_user_profile.sql` | Diagnose the issue | ✅ Yes (read-only) |
| `004_apply_insert_policy_only.sql` | Fix the trigger | ✅ Yes (idempotent) |
| `manual_create_missing_profiles.sql` | Create missing profiles | ✅ Yes (idempotent) |
| `HOW_TO_FIX_MISSING_PROFILES.md` | Detailed guide | 📖 Read if needed |

---

## What the Fix Does

**Before:**
- Trigger exists but can't insert (no INSERT policy)
- Users created but profiles missing

**After:**
- ✅ INSERT policy added to `user_profiles`
- ✅ Trigger working properly
- ✅ Existing users have profiles
- ✅ New signups automatically get profiles

---

## Need Help?

Read `HOW_TO_FIX_MISSING_PROFILES.md` for:
- Detailed explanation
- Troubleshooting guide
- What each script does
- Default values explanation
