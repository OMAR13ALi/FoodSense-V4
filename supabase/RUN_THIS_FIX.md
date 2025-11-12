# Quick Fix: Settings UPSERT Error

## Current Error
```
Failed to save settings: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

## Solution: Add Unique Constraint

**Run this in Supabase SQL Editor:**

📁 File: `005_add_user_settings_constraints.sql`

### Quick Copy-Paste

```sql
-- Add unique constraint on user_id
ALTER TABLE user_settings 
  ADD CONSTRAINT user_settings_user_id_key 
  UNIQUE (user_id);
```

That's it! This single line fixes the issue.

### Full Script (Recommended)

Or run the entire `005_add_user_settings_constraints.sql` file which includes:
- The constraint addition
- Verification queries
- Success messages

## Steps

1. **Open Supabase Dashboard → SQL Editor**
2. **Copy** the contents of `005_add_user_settings_constraints.sql`
3. **Paste** into SQL Editor
4. **Run** (Click Run or press Ctrl+Enter)
5. **Look for:** `✓ CONSTRAINT ADDED SUCCESSFULLY`

## What This Does

- ✅ Adds unique constraint on `user_settings.user_id`
- ✅ Allows `ON CONFLICT (user_id)` to work in UPSERT operations
- ✅ Each authenticated user can have only one settings row
- ✅ Guest users (with `user_id = NULL`) can still have multiple rows

## After Running

1. **Restart your app** (or just reload)
2. **Try saving settings** - should work now!
3. **No more errors** about ON CONFLICT specification

---

**Estimated time: 30 seconds** ⏱️

This is the last fix needed for full authentication support!
