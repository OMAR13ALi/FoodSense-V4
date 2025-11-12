# Setup Guide: New Supabase Project with Clean Auth-First Schema

This guide will walk you through setting up a fresh Supabase project with the new auth-first database schema.

## Why a Fresh Database?

The old database had several critical issues:
- ❌ Missing profile creation causing infinite loading
- ❌ Broken settings upsert (wrong primary key design)
- ❌ Complex hybrid device_id/user_id system causing bugs
- ❌ 9+ conflicting documentation files
- ❌ Multiple failed migration attempts

The new schema provides:
- ✅ Clean auth-first design (no device_id complexity)
- ✅ Proper primary keys and constraints
- ✅ Working profile creation trigger
- ✅ Simplified RLS policies
- ✅ Settings upsert that works correctly

---

## Step 1: Create New Supabase Project

### Option A: Use Existing Project (Recommended for Testing)

If you want to keep your old project as backup and test the new schema:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the details:
   - **Name**: `calorie-app-v2` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it securely!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for development
4. Click "Create new project"
5. Wait 1-2 minutes for project to be provisioned

### Option B: Reset Current Project (⚠️ DESTRUCTIVE)

If you don't need the old data and want to reuse the same project:

1. Go to your Supabase project settings
2. Go to "Database" > "SQL Editor"
3. Run this to drop all tables (see Step 2 for the commands)

---

## Step 2: Apply the New Database Schema

### Method 1: Using Supabase Dashboard (Recommended)

1. In your Supabase project, go to **SQL Editor**
2. Click **"New Query"**
3. Open the file: `supabase/migrations/001_auth_first_clean_schema.sql`
4. **Copy the entire contents** of that file
5. **Paste** it into the SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for the query to complete (should take 2-3 seconds)

### Method 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to project directory
cd C:\Users\omar\Desktop\calorie-app

# Link to your new project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

### Verify the Schema

Run this query in SQL Editor to verify tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- ✅ daily_summaries
- ✅ favorite_meals
- ✅ meals
- ✅ user_profiles
- ✅ user_settings

---

## Step 3: Verify Trigger and RLS

### Check Trigger

Run this to verify the profile creation trigger exists:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

Expected result:
```
trigger_name: on_auth_user_created
event_manipulation: INSERT
event_object_table: users (in auth schema)
```

### Check RLS Policies

Run this to verify RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

### Check Policy Count

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

You should see 4 policies per table (SELECT, INSERT, UPDATE, DELETE).

---

## Step 4: Update Environment Variables

### Get Your New Project Credentials

1. In Supabase Dashboard, go to **Settings** > **API**
2. You'll need:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Update Your .env File

1. Open `.env` file in your project root
2. Update these values:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Add service role key for admin operations (keep this secret!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Verify Connection

Create a test file `test-connection.ts` (or just run in SQL Editor):

```typescript
import { supabase } from './services/supabase-client';

async function testConnection() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('count');

  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('✅ Connected successfully!');
  }
}

testConnection();
```

---

## Step 5: Test Profile Creation

This is the most critical test - it ensures the trigger works correctly.

### Test in SQL Editor

```sql
-- 1. Check current user count
SELECT COUNT(*) FROM auth.users;

-- 2. Create a test user (this will be done via your app, but we can test manually)
-- Note: You can't directly insert into auth.users via SQL for security
-- Instead, test via your app's signup flow

-- 3. After signing up via app, verify profile was created:
SELECT
  u.id,
  u.email,
  p.id as profile_id,
  p.email as profile_email,
  p.created_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
```

Expected: Every user in `auth.users` should have a matching entry in `user_profiles`.

### Test via App

1. **Start your app**: `npm start` or `npx expo start`
2. **Sign up** with a test email
3. **Watch for errors** in console
4. **Verify**:
   - No infinite loading screen
   - Successfully redirected to main app
   - Can save meals and settings

---

## Step 6: Test All Database Operations

### Test Meals

In SQL Editor or via app:

```sql
-- After adding a meal via app, verify it's saved:
SELECT * FROM meals ORDER BY created_at DESC LIMIT 5;

-- Should show:
-- - id (UUID)
-- - user_id (NOT NULL)
-- - text, calories, protein, carbs, fat
-- - timestamp
-- - No device_id column (this is the key change!)
```

### Test Settings

```sql
-- After saving settings via app:
SELECT * FROM user_settings ORDER BY created_at DESC LIMIT 5;

-- Should show:
-- - user_id as PRIMARY KEY (not device_id!)
-- - All settings fields
```

### Test Upsert

This was broken in the old schema. Test that it works now:

```sql
-- Insert initial settings
INSERT INTO user_settings (user_id, daily_calorie_goal, target_protein, target_carbs, target_fat)
VALUES ('YOUR_USER_ID_HERE', 2000, 150, 250, 65);

-- Update settings (this should work now)
INSERT INTO user_settings (user_id, daily_calorie_goal, target_protein, target_carbs, target_fat)
VALUES ('YOUR_USER_ID_HERE', 2200, 160, 270, 70)
ON CONFLICT (user_id) DO UPDATE SET
  daily_calorie_goal = EXCLUDED.daily_calorie_goal,
  target_protein = EXCLUDED.target_protein,
  target_carbs = EXCLUDED.target_carbs,
  target_fat = EXCLUDED.target_fat,
  updated_at = NOW();

-- Verify only one row exists per user
SELECT user_id, COUNT(*) FROM user_settings GROUP BY user_id;
-- Each user should have exactly 1 row
```

---

## Step 7: Production Checklist

Before deploying to production:

### Security Checklist

- [ ] RLS is enabled on all tables
- [ ] All policies tested and working
- [ ] Service role key is kept secret (not in git)
- [ ] anon key is public-safe (only allows RLS-restricted operations)
- [ ] Password reset flow tested
- [ ] Email confirmation enabled (Supabase Settings > Auth)

### Performance Checklist

- [ ] Indexes created (they're in the migration file)
- [ ] No N+1 query issues in app
- [ ] Connection pooling enabled (default in Supabase)

### Backup Checklist

- [ ] Database backups enabled (Supabase Settings > Database > Backups)
- [ ] Point-in-time recovery enabled (paid plans)
- [ ] Export schema for reference: `pg_dump -s > schema_backup.sql`

---

## Comparison: Old vs New Schema

### Key Differences

| Aspect | Old Schema | New Schema |
|--------|-----------|------------|
| **Primary Auth** | device_id (with optional user_id) | user_id ONLY (auth required) |
| **user_settings PK** | device_id | user_id (fixes upsert!) |
| **meals.device_id** | NOT NULL | Removed entirely |
| **Profile creation** | Broken trigger | Working trigger + INSERT policy |
| **RLS policies** | Complex dual-mode | Simple auth.uid() checks |
| **Guest mode** | Supported (caused bugs) | Not supported (cleaner) |
| **Migration path** | Complex device→user | Not needed (auth-first) |

### Code Changes

| File | Changes |
|------|---------|
| **database-service.ts** | Removed all device_id logic, simplified queries |
| **types/index.ts** | Removed device_id and migrated_at from UserProfile |
| **app/_layout.tsx** | No changes needed (already auth-first) |

---

## Troubleshooting

### Issue: "User not authenticated" errors

**Cause**: The new schema requires authentication for all operations.

**Fix**:
1. Make sure user is logged in before accessing data
2. Check AuthContext is providing user correctly
3. Verify getCurrentUserId() doesn't throw error

### Issue: Profile not created on signup

**Symptoms**: Infinite loading screen after signup

**Debug**:
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'create_user_profile';

-- Check RLS INSERT policy on user_profiles
SELECT * FROM pg_policies WHERE tablename = 'user_profiles' AND cmd = 'INSERT';
```

**Fix**: Rerun the migration file, ensuring no errors.

### Issue: Settings upsert still fails

**Symptoms**: Error about "no unique or exclusion constraint"

**Debug**:
```sql
-- Verify user_id is the primary key
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_settings';
-- Should show: PRIMARY KEY on user_id
```

**Fix**: Make sure migration was applied completely.

### Issue: Can't query meals

**Symptoms**: Empty meals array or permission denied

**Debug**:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'meals';

-- Test direct query (in SQL Editor)
SELECT * FROM meals WHERE user_id = 'YOUR_USER_ID';
```

**Fix**: Make sure you're using the anon key (not service role key) in the app.

---

## Migration from Old Database (Optional)

If you have important data in the old database that you want to migrate:

### Export Old Data

```sql
-- Export meals
COPY (
  SELECT * FROM meals WHERE user_id = 'YOUR_USER_ID'
) TO '/tmp/meals_backup.csv' WITH CSV HEADER;

-- Export settings
COPY (
  SELECT * FROM user_settings WHERE user_id = 'YOUR_USER_ID'
) TO '/tmp/settings_backup.csv' WITH CSV HEADER;
```

### Import to New Database

1. Clean the CSV files:
   - Remove device_id column from meals
   - Change user_settings to use user_id as identifier

2. Import via SQL:
```sql
-- Import meals
COPY meals FROM '/tmp/meals_cleaned.csv' WITH CSV HEADER;

-- Import settings
COPY user_settings FROM '/tmp/settings_cleaned.csv' WITH CSV HEADER;
```

**Note**: This is manual and error-prone. Only do this if you have critical production data.

---

## Next Steps

After setup is complete:

1. ✅ **Test thoroughly**: Sign up, add meals, save settings
2. ✅ **Build new features**: You now have a clean foundation!
3. ✅ **Clean up old files**: Delete old migrations and fix docs (optional)
4. ✅ **Update documentation**: Document your new schema

---

## Support

If you encounter issues:

1. Check the [Supabase Logs](https://supabase.com/dashboard/project/_/logs) for errors
2. Review the SQL migration file for any syntax errors
3. Verify all environment variables are correct
4. Check that RLS policies are enabled and correct

---

## Summary of Changes

### ✅ What's Fixed

- Profile creation works automatically on signup
- Settings upsert works correctly (user_id as primary key)
- No more device_id complexity
- Clean, simple RLS policies
- All CRUD operations work smoothly

### 🎯 What's New

- Auth-first design (simpler and more secure)
- Proper constraints and indexes
- Clean codebase with no technical debt
- Ready for future features (favorites, profile screens, etc.)

### 🗑️ What's Removed

- device_id columns and logic
- Guest mode support
- Migration tracking fields
- Complex dual-mode queries

---

**Your database is now ready for production! 🎉**
