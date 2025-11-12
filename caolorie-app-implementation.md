# Phase 1: UI Implementation - AI Calorie Tracker

## Overview

Create all UI screens with mock data to establish the complete user flow and visual design. No AI integration, auth, or database in this phase.

## Key Screens to Build

### 1. App Structure & Navigation

- Set up tab-based navigation (Dashboard, Summary, Settings)
- Configure Expo Router for smooth transitions
- Add custom tab bar with icons

### 2. Dashboard Screen (Main Screen)

Based on screenshots, implement:

- Top bar with "Today" label, refresh icon, and settings icon
- Input field for meal entry (auto-focus with placeholder)
- List of meal entries with:
  - Meal text on left
  - Calorie count on right (e.g., "+ 970 cal")
- Loading states: "searching..." with emoji indicators
- Bottom floating bar showing:
  - "Remaining" label
  - Current/Goal calories (e.g., "1,000 / 2,000 cal")
  - Keyboard icon
- Mock data: Pre-populate with sample entries

### 3. Settings Screen

Implement sections:

- **Nutrition Goals**
  - Daily Calorie Goal (2,000 cal) - with emoji 🔥
  - Target Protein (150 g) - with emoji 🥩
  - Target Carbs (250 g) - with emoji 🥖
  - Target Fat (65 g) - with emoji 💧
- **Preferences**
  - Meal Reminders (toggle)
  - Track Water Intake (toggle)
  - Dark Mode (toggle)
- Clean layout with icons and adjustable values

### 4. Daily Summary Screen

- Circular progress indicator (consumed vs goal)
- List of all meals for the day
- Total calories consumed
- Macro breakdown (if available)
- Navigation to history (placeholder for Phase 2+)

## Technical Approach

### State Management

- Use React Context or Zustand for:
  - User settings (calorie goal, macros, preferences)
  - Daily meal entries
  - Total calories consumed
- Mock data stored in local state (no persistence yet)

### UI Components to Create

- `MealEntryCard` - displays meal text + calories
- `CalorieProgressBar` - bottom bar with remaining calories
- `SettingsRow` - reusable settings item with icon, label, value
- `ToggleSwitch` - custom toggle for preferences
- `CircularProgress` - for daily summary visualization
- `LoadingIndicator` - "searching..." state with emojis

### Styling

- Light color palette matching screenshots (soft pink/beige background)
- Clean typography (SF Pro or system default)
- Subtle shadows and rounded corners
- Responsive layout for different screen sizes

## Mock Data Structure

```typescript
// Sample meal entries
{
  id: string,
  text: string,
  calories: number,
  timestamp: Date,
  isLoading?: boolean
}

// User settings
{
  dailyCalorieGoal: 2000,
  targetProtein: 150,
  targetCarbs: 250,
  targetFat: 65,
  mealReminders: false,
  trackWater: true,
  darkMode: false
}
```

## Testing Flow

User can:

1. Type meal descriptions in input field
2. See mock "searching" animation
3. View meal entries with mock calories appear
4. Navigate to Settings and adjust goals
5. Toggle preferences
6. View Daily Summary with circular progress
7. Test full navigation flow

## Files to Create/Modify

- `app/(tabs)/_layout.tsx` - tab navigation
- `app/(tabs)/index.tsx` - Dashboard screen
- `app/(tabs)/summary.tsx` - Daily Summary screen
- `app/(tabs)/settings.tsx` - Settings screen
- `components/MealEntryCard.tsx`
- `components/CalorieProgressBar.tsx`
- `components/SettingsRow.tsx`
- `components/CircularProgress.tsx`
- `contexts/AppContext.tsx` - state management
- `types/index.ts` - TypeScript types
- `constants/mockData.ts` - sample data

## Deliverables

- Fully navigable app with all screens
- Clean UI matching design screenshots
- Mock interactions (add meal, see calories update)
- Testable on Expo Go (Android/iOS)
- Ready for Phase 2 (AI integration)