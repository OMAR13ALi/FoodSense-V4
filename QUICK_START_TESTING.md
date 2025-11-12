# Quick Start - Testing the Optimizations

## 🚀 Fast Track Testing (5 minutes)

### Prerequisites
1. Make sure `.env` has valid `PERPLEXITY_API_KEY`
2. Start the app: `npm start`
3. Open on your device/emulator

---

## ⚡ Test 1: Verify Cache is Working (2 min)

### Step 1: Type common foods
```
banana
chicken breast
eggs
apple
```

### ✅ Expected Result
- All entries should appear **instantly** (< 1 second)
- Each should have a **⚡** icon next to the calories
- Example: `105 cal ⚡`

### ❌ If it fails
- Cache might not be loading
- Check console for errors
- Verify `nutrition-cache.ts` exports correctly

---

## 🌐 Test 2: Verify API Cache Works (2 min)

### Step 1: Type an uncommon food
```
dragon fruit smoothie bowl
```

### Step 2: Wait for result
- Should take 2-5 seconds
- Should show **🌐** icon (web search)

### Step 3: Delete and retype SAME food
```
dragon fruit smoothie bowl
```

### ✅ Expected Result
- Second time should be **instant**
- Should show **💾** icon (cached)

### ❌ If it fails
- API cache not saving
- Check AsyncStorage permissions
- Check `api-response-cache.ts`

---

## 🔄 Test 3: Verify Request Queue (1 min)

### Step 1: Paste multiple uncommon foods
```
quinoa bowl with avocado
matcha latte with oat milk
acai smoothie
chia seed pudding
```

### ✅ Expected Result
- All should show "searching..." state
- Should complete **one at a time** (not all at once)
- Watch them finish sequentially with ~500ms gaps
- **No rate limit errors**

### ❌ If it fails
- Request queue not working
- Check `createRequestQueue()` in `ai-service.ts`

---

## 📊 Test 4: Verify Source Display (1 min)

### Step 1: Tap any entry to open details modal

### ✅ Expected Result
- Modal opens with nutrition breakdown
- Scroll to bottom
- Should see "Data Sources" section
- Should show icon + text:
  - "🇺🇸 USDA FoodData Central" (for cached)
  - "🌐 Web Search" (for API)
  - "⚡ Cache" (for cached)

### ❌ If it fails
- Source data not being passed
- Check `NutritionDetailsModal.tsx`
- Verify `meal.sources` array exists

---

## ✅ Success Criteria

If all 4 tests pass:
- ✅ Static cache working (instant results)
- ✅ API cache working (second lookups instant)
- ✅ Request queue working (no rate limits)
- ✅ Source transparency working (icons visible)

**You're ready to deploy!**

---

## 🐛 Troubleshooting

### All entries taking 2-5 seconds
**Problem**: Cache not being checked  
**Fix**: 
```bash
# Check if getCachedNutrition is called
# Add console.log in ai-service.ts
console.log('Checking cache for:', mealText);
```

### Icons not showing
**Problem**: Source data not passed  
**Fix**:
```bash
# Check meal.sources exists
console.log('Meal sources:', meal.sources);
```

### Rate limit errors (429)
**Problem**: Request queue not working  
**Fix**:
```bash
# Verify queue is initialized
# Check ai-service.ts exports
```

---

## 📈 What to Monitor

After deployment, check:

1. **API Call Volume**
   - Should be 70-90% lower than before
   - Monitor Perplexity dashboard

2. **Response Times**
   - Common foods: < 100ms
   - Uncommon foods (first time): 2-5s
   - Uncommon foods (cached): < 100ms

3. **Error Rate**
   - Should see no rate limit errors
   - Should see no cache-related crashes

---

## 📚 Full Documentation

For detailed testing scenarios, see:
- **`TESTING_GUIDE.md`** - Complete test scenarios
- **`OPTIMIZATION_SUMMARY.md`** - Technical overview
- **`PRE_DEPLOYMENT_CHECKLIST.md`** - Deployment steps

---

## 🎯 Bottom Line

**4 quick tests = 5 minutes = Ready to deploy**

Good luck! 🚀
