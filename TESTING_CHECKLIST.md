# Testing Checklist: Auth-First Database Migration

This checklist will help you verify that all changes are working correctly after migrating to the new auth-first database schema.

## 🔧 Pre-Testing Setup

### 1. Verify Code Changes

- [x] database-service.ts updated (device_id logic removed)
- [x] types/index.ts updated (device_id fields removed)
- [x] app/_layout.tsx reviewed (auth flow correct)
- [x] New migration file created (001_auth_first_clean_schema.sql)

### 2. Environment Setup

- [ ] New Supabase project created
- [ ] Migration applied successfully
- [ ] .env file updated with new credentials
- [ ] App can connect to new database

### 3. Build Check

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Start the app in development mode
npm start
# or
npx expo start
```

---

## 🧪 Core Functionality Tests

### Test 1: User Signup

**Steps:**
1. Open the app
2. Navigate to signup screen
3. Enter test email: `test@example.com`
4. Enter password: `TestPassword123!`
5. Click "Sign Up"

**Expected Results:**
- ✅ No errors in console
- ✅ User created in auth.users
- ✅ Profile automatically created in user_profiles
- ✅ NO infinite loading screen
- ✅ Successfully redirected to main app (/(tabs))

**Verify in SQL:**
```sql
SELECT
  u.id,
  u.email,
  p.id as profile_id,
  p.daily_calorie_goal,
  p.created_at
FROM auth.users u
INNER JOIN user_profiles p ON u.id = p.id
WHERE u.email = 'test@example.com';
```

**Result:** Profile should exist with default values.

---

### Test 2: User Login

**Steps:**
1. Log out from app
2. Navigate to login screen
3. Enter email: `test@example.com`
4. Enter password: `TestPassword123!`
5. Click "Log In"

**Expected Results:**
- ✅ No errors in console
- ✅ Successfully authenticated
- ✅ Redirected to main app
- ✅ Profile data loaded

**Verify in Console:**
Look for successful auth messages, no "User not authenticated" errors.

---

### Test 3: Add Meal

**Steps:**
1. Log in as test user
2. Navigate to meals screen
3. Enter meal text: "Chicken breast with rice"
4. Wait for AI analysis
5. Save meal

**Expected Results:**
- ✅ AI analysis completes successfully
- ✅ Meal saved to database
- ✅ Meal appears in list
- ✅ No device_id errors

**Verify in SQL:**
```sql
SELECT
  id,
  user_id,
  text,
  calories,
  protein,
  carbs,
  fat,
  timestamp
FROM meals
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
ORDER BY created_at DESC
LIMIT 5;
```

**Result:**
- Should show the meal
- user_id should be populated (NOT NULL)
- No device_id column should exist

---

### Test 4: Load Meals

**Steps:**
1. Add 3-4 meals
2. Navigate away and back
3. Verify meals persist

**Expected Results:**
- ✅ All meals load correctly
- ✅ Sorted by timestamp
- ✅ Nutrition data intact
- ✅ No duplicate meals

**Verify in SQL:**
```sql
SELECT DATE(timestamp) as date, COUNT(*) as meal_count
FROM meals
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

---

### Test 5: Save Settings (Critical - This Was Broken!)

**Steps:**
1. Go to settings screen
2. Change daily calorie goal to 2500
3. Change target protein to 180g
4. Save settings
5. Navigate away and back
6. Verify changes persisted

**Expected Results:**
- ✅ NO "no unique or exclusion constraint" error
- ✅ Settings saved successfully
- ✅ Settings persist after reload
- ✅ Only ONE row per user in user_settings

**Verify in SQL:**
```sql
-- Check settings were saved
SELECT
  user_id,
  daily_calorie_goal,
  target_protein,
  target_carbs,
  target_fat,
  updated_at
FROM user_settings
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- Verify only one row per user
SELECT user_id, COUNT(*) as count
FROM user_settings
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**Result:**
- First query should show your updated settings
- Second query should return ZERO rows (no duplicates)

---

### Test 6: Update Settings (Upsert Test)

**Steps:**
1. Save settings with calorie goal = 2500
2. Change calorie goal to 2800
3. Save again
4. Check database

**Expected Results:**
- ✅ No errors
- ✅ Settings updated (not duplicated)
- ✅ updated_at timestamp changed

**Verify in SQL:**
```sql
SELECT user_id, daily_calorie_goal, updated_at
FROM user_settings
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

**Result:** Should show calorie_goal = 2800, only ONE row.

---

### Test 7: Delete Meals

**Steps:**
1. Add a meal
2. Delete the meal
3. Verify it's removed

**Expected Results:**
- ✅ Meal removed from UI
- ✅ Meal removed from database
- ✅ No orphaned data

**Verify in SQL:**
```sql
SELECT COUNT(*) as meal_count
FROM meals
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

---

### Test 8: Data Isolation (Security Test)

**Steps:**
1. Create two test users:
   - User A: `usera@test.com`
   - User B: `userb@test.com`
2. Log in as User A, add meals
3. Log in as User B, add different meals
4. Log back in as User A
5. Verify only User A's meals are visible

**Expected Results:**
- ✅ User A sees ONLY their meals
- ✅ User B sees ONLY their meals
- ✅ No cross-user data leakage

**Verify in SQL:**
```sql
-- User A meals
SELECT text FROM meals
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usera@test.com');

-- User B meals
SELECT text FROM meals
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'userb@test.com');
```

---

### Test 9: Storage Stats

**Steps:**
1. Add meals over multiple days
2. Check storage stats

**Expected Results:**
- ✅ Correct totalMealDays count
- ✅ lastSyncDate shows latest meal
- ✅ userId (not deviceId) returned

**Verify Code:**
The getStorageStats function should return `userId` field now (not `deviceId`).

---

### Test 10: Export/Import Data

**Steps:**
1. Add several meals
2. Export data
3. Clear all data
4. Import data back
5. Verify meals restored

**Expected Results:**
- ✅ Export creates valid JSON
- ✅ JSON contains meals and settings
- ✅ JSON contains userId (not deviceId)
- ✅ Import restores all data correctly

---

## 🔒 Security Tests

### Test 11: RLS Enforcement

**Test in SQL Editor (using anon key):**

```sql
-- This should FAIL (can't see other users' data)
SELECT * FROM meals WHERE user_id != auth.uid();
-- Expected: Empty result or permission denied

-- This should SUCCEED (can see own data)
SELECT * FROM meals WHERE user_id = auth.uid();
-- Expected: Your meals
```

### Test 12: Unauthenticated Access

**Steps:**
1. Log out
2. Try to access main app routes directly

**Expected Results:**
- ✅ Redirected to onboarding/welcome
- ✅ Cannot access /(tabs) routes
- ✅ No data queries execute

---

## 🚨 Error Handling Tests

### Test 13: Network Errors

**Steps:**
1. Turn off internet
2. Try to save a meal
3. Turn internet back on

**Expected Results:**
- ✅ Graceful error message
- ✅ No app crash
- ✅ Retry works when back online

### Test 14: Auth Errors

**Steps:**
1. Try to sign up with existing email
2. Try to log in with wrong password

**Expected Results:**
- ✅ Clear error messages
- ✅ No infinite loading
- ✅ User can retry

---

## 🏃 Performance Tests

### Test 15: Large Dataset

**Steps:**
1. Add 50+ meals
2. Navigate between dates
3. Test scrolling performance

**Expected Results:**
- ✅ Queries remain fast (<500ms)
- ✅ UI remains responsive
- ✅ No memory leaks

**Check SQL Performance:**
```sql
EXPLAIN ANALYZE
SELECT * FROM meals
WHERE user_id = 'YOUR_USER_ID'
  AND timestamp >= '2024-01-01'
  AND timestamp < '2024-01-02'
ORDER BY timestamp DESC;
```

Should use indexes (idx_meals_user_timestamp).

---

## 🐛 Known Issues to Watch For

### Issue 1: "User not authenticated" on every action

**Cause:** getCurrentUserId() throwing error

**Debug:**
```typescript
// Add logging in database-service.ts
async function getCurrentUserId(): Promise<string> {
  console.log('Getting current user...');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.id);
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}
```

### Issue 2: Settings save fails with "null value"

**Cause:** Missing required fields in settingsToDbFormat

**Fix:** Ensure all required fields have default values

### Issue 3: Meals not loading after signup

**Cause:** Profile not created, causing auth issues

**Debug SQL:**
```sql
SELECT u.email, p.id as profile_exists
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

Should return zero rows.

---

## ✅ Final Verification

### Checklist Summary

- [ ] ✅ Signup creates profile automatically
- [ ] ✅ Login works without issues
- [ ] ✅ Meals can be added and loaded
- [ ] ✅ Settings can be saved and updated (no upsert errors)
- [ ] ✅ Data is isolated between users
- [ ] ✅ RLS policies enforce security
- [ ] ✅ No device_id references anywhere
- [ ] ✅ Export/import works
- [ ] ✅ Storage stats work
- [ ] ✅ App doesn't crash on errors

### Database Health Check

Run this comprehensive health check:

```sql
-- 1. Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- 3. Check all users have profiles
SELECT COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Check for duplicate settings
SELECT user_id, COUNT(*) as count
FROM user_settings
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 5. Check for orphaned meals (shouldn't be possible with FK)
SELECT COUNT(*) as orphaned_meals
FROM meals m
LEFT JOIN auth.users u ON m.user_id = u.id
WHERE u.id IS NULL;

-- 6. Check indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Expected Results:**
- 5 tables: daily_summaries, favorite_meals, meals, user_profiles, user_settings
- All tables have rowsecurity = true
- users_without_profiles = 0
- No duplicate settings
- No orphaned meals
- Multiple indexes on each table

---

## 🎉 Success Criteria

Your migration is successful if:

1. ✅ **All tests pass** with no errors
2. ✅ **No device_id references** in queries or errors
3. ✅ **Settings upsert works** (the main bug is fixed!)
4. ✅ **Profile creation works** (no infinite loading)
5. ✅ **Data is secure** (RLS enforced)
6. ✅ **Performance is good** (queries use indexes)
7. ✅ **Code is clean** (no TypeScript errors)

---

## 📊 Testing Summary Report Template

After testing, fill this out:

```
# Testing Summary: [Date]

## Environment
- Supabase Project: [Project Name/ID]
- App Version: [Version]
- Test User: [Email]

## Test Results
- Signup: ✅ / ❌
- Login: ✅ / ❌
- Add Meals: ✅ / ❌
- Load Meals: ✅ / ❌
- Save Settings: ✅ / ❌
- Update Settings (Upsert): ✅ / ❌
- Data Isolation: ✅ / ❌
- RLS Enforcement: ✅ / ❌

## Issues Found
1. [Description of issue 1]
2. [Description of issue 2]

## Resolved Issues
- ✅ Settings upsert error (fixed with user_id as PK)
- ✅ Profile creation (fixed with proper trigger + INSERT policy)
- ✅ Infinite loading on signup (fixed)

## Performance Metrics
- Average meal load time: [X ms]
- Average settings save time: [X ms]
- Database size: [X MB]

## Conclusion
Migration successful: YES / NO

## Next Steps
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Clean up old documentation
```

---

## 🔄 Rollback Plan (If Needed)

If you encounter critical issues:

### Option 1: Keep Old Project Running

If you created a new project, simply:
1. Update .env to point back to old project
2. Revert code changes (git checkout)
3. Investigate issues before trying again

### Option 2: Restore from Backup

If you dropped tables in existing project:
1. Go to Supabase Dashboard > Database > Backups
2. Restore from latest backup
3. Wait for restoration
4. Revert code changes

---

**Happy Testing! 🚀**

If all tests pass, you now have a clean, working, auth-first database ready for production!
