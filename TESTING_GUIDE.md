# Testing Guide - Calorie App Optimizations

## Overview
This guide covers manual testing scenarios to verify all optimization features are working correctly.

## Prerequisites
1. Make sure `.env` file has valid API keys
2. Clear app cache before testing: Settings → Clear All Data
3. Have network connection for API calls

---

## Test Scenario 1: Static USDA Cache (Instant Results)

### Goal
Verify that common foods from USDA cache return instantly with ⚡ icon.

### Steps
1. Open the app and go to Dashboard
2. Type the following entries (one per line):
   ```
   banana
   chicken breast
   grilled cheese sandwich
   pizza slice
   eggs
   ```

### Expected Results
- All entries should show results **instantly** (< 100ms)
- Each calorie count should have a **⚡** icon next to it
- Example: `105 cal ⚡`
- Open nutrition details modal (tap any entry) and verify:
  - Source shows: "🇺🇸 USDA FoodData Central"
  - Or: "⚡ Cache"

### What It Tests
- Static nutrition cache lookup
- Inline source icon display
- Modal source display

---

## Test Scenario 2: Fuzzy Matching

### Goal
Verify that variations of cached foods are matched correctly.

### Steps
1. Clear the text input
2. Type the following entries:
   ```
   2 bananas
   grilled chicken
   medium apple
   large eggs
   pepperoni pizza
   ```

### Expected Results
- All entries should return quickly with ⚡ icon
- "2 bananas" should match "banana" from cache
- "grilled chicken" should match "chicken breast"
- "medium apple" should match "apple"
- "large eggs" should match "eggs"

### What It Tests
- Fuzzy matching algorithm
- Plural/singular handling
- Descriptor removal (size, quantity)

---

## Test Scenario 3: API Response Cache

### Goal
Verify that API responses are cached locally for 7 days.

### Steps
1. Clear the text input
2. Type an uncommon food that's NOT in USDA cache:
   ```
   dragon fruit smoothie bowl
   ```
3. Wait for the API call to complete (should take 2-5 seconds)
4. Note the icon: should be **🌐** (web search)
5. Delete the line
6. Type the SAME entry again:
   ```
   dragon fruit smoothie bowl
   ```

### Expected Results
- **First time**: 🌐 icon, takes 2-5 seconds
- **Second time**: 💾 icon, returns instantly
- Modal source should show "💾 Cache" for the second lookup

### What It Tests
- API response caching
- 7-day cache expiry
- Local storage persistence

---

## Test Scenario 4: Request Queue (Rate Limit Prevention)

### Goal
Verify that multiple API calls are queued and processed sequentially.

### Steps
1. Clear the text input
2. Paste multiple uncommon foods at once:
   ```
   quinoa bowl with avocado
   matcha latte with oat milk
   acai smoothie
   chia seed pudding
   kombucha
   ```

### Expected Results
- All lines should show "searching..." state
- They should complete **one at a time** with 500ms delay between each
- Watch the status: calculating → done (sequential, not all at once)
- No rate limit errors (no "429 Too Many Requests")

### What It Tests
- Request queue implementation
- Sequential processing
- Rate limit prevention

---

## Test Scenario 5: Mixed Sources Display

### Goal
Verify that different source types are correctly displayed.

### Steps
1. Clear the text input
2. Type a mix of cached and non-cached foods:
   ```
   banana
   dragonfruit smoothie
   chicken breast
   matcha latte
   ```

### Expected Results
- Line 1: ⚡ (USDA cache)
- Line 2: 🌐 (web search, first time) or 💾 (if previously searched)
- Line 3: ⚡ (USDA cache)
- Line 4: 🌐 (web search, first time) or 💾 (if previously searched)

### What It Tests
- Multiple source types in same view
- Source icon accuracy

---

## Test Scenario 6: Source Details in Modal

### Goal
Verify detailed source information in nutrition modal.

### Steps
1. Keep the entries from Test 5
2. Tap on each entry to open nutrition modal
3. Check the "Data Sources" section at the bottom

### Expected Results
For cached entries (banana, chicken breast):
- Should show: "🇺🇸 USDA FoodData Central" or "⚡ Cache"

For API entries (dragonfruit smoothie, matcha latte):
- First time: "🌐 Web Search" or "💚 Nutritionix"
- Second time: "💾 Cache" (if previously fetched)

### What It Tests
- Modal source display
- Source icon mapping
- Multiple sources display

---

## Test Scenario 7: Performance & Cost Verification

### Goal
Measure cache hit rate and estimate cost savings.

### Steps
1. Clear all data (Settings → Clear All Data)
2. Use the app normally for a full day
3. Log various foods throughout the day
4. At end of day, check console logs for cache statistics

### Expected Results
- **Cache hit rate**: 70-90% (most foods from cache)
- **API calls**: Only 10-30% of entries
- **Cost estimate**: 
  - 50 entries/day × 10% API rate = ~5 API calls
  - vs. 50 API calls without cache
  - 90% reduction in API usage

### What It Tests
- Real-world cache effectiveness
- Cost savings verification

---

## Test Scenario 8: Cache Persistence

### Goal
Verify that API response cache persists across app restarts.

### Steps
1. Type an uncommon food:
   ```
   beet hummus wrap
   ```
2. Wait for result (should be 🌐)
3. Force close the app
4. Reopen the app
5. Type the same entry again

### Expected Results
- Second time should show 💾 icon (cached)
- Result should be instant (< 100ms)
- Cache survives app restart

### What It Tests
- AsyncStorage persistence
- Cache retrieval after app restart

---

## Test Scenario 9: Error Handling

### Goal
Verify graceful error handling when API fails.

### Steps
1. Turn off network connection
2. Type a non-cached food:
   ```
   exotic tropical fruit bowl
   ```
3. Wait for response

### Expected Results
- Should show error state or fallback message
- Should NOT crash the app
- When network returns, retry should work

### What It Tests
- Network error handling
- Graceful degradation

---

## Test Scenario 10: Complete User Flow

### Goal
Simulate a realistic day of food tracking.

### Steps
1. **Breakfast** (type in Dashboard):
   ```
   2 eggs
   toast
   banana
   coffee with milk
   ```

2. **Lunch**:
   ```
   grilled chicken salad
   apple
   sparkling water
   ```

3. **Snack**:
   ```
   protein bar
   almonds
   ```

4. **Dinner**:
   ```
   salmon fillet
   roasted vegetables
   quinoa
   ```

### Expected Results
- Most entries should be instant (⚡)
- Few or no API calls needed (🌐)
- Total calories visible in progress bar
- All entries accessible in Summary tab
- Source transparency on every entry

### What It Tests
- Complete user experience
- Real-world performance
- Cost efficiency

---

## Success Criteria

✅ **Static Cache**: Common foods return instantly with ⚡ icon  
✅ **Fuzzy Matching**: Variations are matched correctly  
✅ **API Cache**: Second lookups are instant with 💾 icon  
✅ **Request Queue**: No rate limit errors, sequential processing  
✅ **Source Icons**: Correct icons displayed inline and in modal  
✅ **Persistence**: Cache survives app restarts  
✅ **Performance**: 80%+ cache hit rate  
✅ **Cost Savings**: 80%+ reduction in API calls  

---

## Debugging Tips

### Check Cache Status
Add these logs in your code to debug:
```typescript
console.log('Cache check:', { found: !!cached, source: cached?.source });
```

### Monitor API Calls
Look for console logs:
- "Making API call..." (should be rare)
- "Cache hit!" (should be common)

### Verify Storage
In React Native:
```typescript
AsyncStorage.getAllKeys().then(keys => console.log('Stored keys:', keys));
```

### Check Network Tab
Use React Native Debugger to monitor:
- Perplexity API calls
- Request frequency
- Response times

---

## Troubleshooting

### Issue: All entries showing 🌐 instead of ⚡
**Cause**: Static cache not loading  
**Fix**: Check `nutrition-cache.ts` export

### Issue: Cache not persisting
**Cause**: AsyncStorage not working  
**Fix**: Check AsyncStorage permissions, verify imports

### Issue: Rate limit errors
**Cause**: Request queue not working  
**Fix**: Check `createRequestQueue` in `ai-service.ts`

### Issue: Icons not showing
**Cause**: Source data not being passed  
**Fix**: Verify `sources` array in meal data

---

## Next Steps After Testing

1. Monitor API usage in production
2. Track cache hit rates via analytics
3. Expand USDA cache with more common foods
4. Implement cache invalidation strategy
5. Add user preference for data sources
