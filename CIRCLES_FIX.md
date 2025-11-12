# Fix: Sources Circles Now Always Display

## Problem
The mini circular source logos weren't showing up. The animation jumped directly from "calculating..." to the final calories, skipping the circles phase entirely.

## Root Cause
```typescript
// What was happening:
1. Set status: 'calculating'
2. Start 350ms timeout to show circles
3. API call completes quickly (due to 350ms artificial delay for cached results)
4. clearTimeout(sourcesTimeoutId) ← Cancelled the circles!
5. Set status: 'done' immediately
6. Result: calculating → calories (no circles!)
```

## Solution Implemented

### 1. Removed Timeout Cancellation
- **Before**: `clearTimeout(sourcesTimeoutId)` cancelled the sources phase
- **After**: Let the timeout always fire at 350ms

### 2. Added Minimum Display Time
```typescript
const MIN_SOURCES_DISPLAY = 800; // ms
// 350ms to reach sources + 450ms for circle animations
```

### 3. Track Elapsed Time
```typescript
const startTime = Date.now();
// ... API call ...
const elapsed = Date.now() - startTime;
const remainingTime = Math.max(0, MIN_SOURCES_DISPLAY - elapsed);
```

### 4. Wait for Minimum Duration
```typescript
if (remainingTime > 0) {
  await new Promise(resolve => setTimeout(resolve, remainingTime));
}
```

### 5. Update Sources Data During Display
```typescript
// While status is still 'sources', update the data
setLineCalories(prev => ({
  ...prev,
  [index]: { 
    ...prev[index],
    sources: result.sources, // Circles now show correct logos
  },
}));
```

## New Timeline

### Cached Result (e.g., "apple"):
```
0ms     → User stops typing
1500ms  → Debounce triggers
1500ms  → Status: 'calculating' (slides down ↓)
1850ms  → Status: 'sources' (circles appear ○○○)
1850ms  → API returns quickly (~350ms due to cache)
2200ms  → Result available but...
2200ms  → Wait! Only 700ms elapsed, need 800ms minimum
2300ms  → Update circle sources with real data
2400ms  → Wait 100ms more for stagger animation
2500ms  → Status: 'done' (calories slide down ↓)

Total: ~1 second from calculation
Visual: ✅ All 3 phases clearly visible!
```

### API Call (slower):
```
0ms     → User stops typing
1500ms  → Debounce triggers
1500ms  → Status: 'calculating'
1850ms  → Status: 'sources' (circles appear)
3500ms  → API responds (took 2000ms)
3500ms  → Elapsed: 2000ms (> 800ms minimum)
3500ms  → No additional wait needed
3600ms  → Status: 'done'

Visual: ✅ All 3 phases visible (circles during API wait)
```

## Changes Made

### File: `app/(tabs)/index.tsx`

**Removed:**
- `let sourcesTimeoutId` declaration
- `clearTimeout(sourcesTimeoutId)` calls

**Added:**
- `const startTime = Date.now()` - Track timing
- `const MIN_SOURCES_DISPLAY = 800` - Minimum duration
- Elapsed time calculation
- `remainingTime` wait logic
- Update sources data during sources phase
- 100ms delay for stagger completion

## Testing

Now when you type any food:
1. ✅ "calculating..." slides down from top
2. ✅ ○ ○ ○ mini circles appear (USDA, Cache, Web, etc.)
3. ✅ "+ XXX cal" slides down from top

All 3 phases are now guaranteed to display for every meal entry!

## Example Foods to Test

- **"apple"** → Should see: calculating → ⚡🇺🇸 → + 95 cal
- **"banana"** → Should see: calculating → ⚡🇺🇸 → + 105 cal
- **"grilled salmon"** → Should see: calculating → 🌐🔮 → + calories
- **Any cached food** → All 3 phases visible
- **Any API food** → All 3 phases visible

The circles will show for a minimum of 450ms, giving users clear visual feedback about data sources!
