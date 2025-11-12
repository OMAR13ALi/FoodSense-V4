/**
 * TypeScript types for the Calorie Tracker App
 */

// Meal entry interface
export interface MealEntry {
  id: string; // UUID v4 format - matches database schema
  text: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  timestamp: Date;
  isLoading?: boolean;
  // AI metadata fields
  aiExplanation?: string; // AI's reasoning about the nutrition data
  confidence?: number; // 0-1 confidence score from AI
  sources?: string[]; // Data sources used by AI
  error?: string; // Error message if AI analysis failed
}

// User settings interface
export interface UserSettings {
  dailyCalorieGoal: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  mealReminders: boolean;
  trackWater: boolean;
  darkMode: boolean;
}

// App state interface
export interface AppState {
  meals: MealEntry[];
  settings: UserSettings;
  favorites: FavoriteMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// Action types for context
export type AppAction =
  | { type: 'ADD_MEAL'; payload: MealEntry }
  | { type: 'UPDATE_MEAL'; payload: { id: string; updates: Partial<MealEntry> } }
  | { type: 'DELETE_MEAL'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'CLEAR_MEALS' }
  | { type: 'SET_LOADING'; payload: { id: string; isLoading: boolean } }
  | { type: 'SET_FAVORITES'; payload: FavoriteMeal[] }
  | { type: 'ADD_FAVORITE'; payload: FavoriteMeal }
  | { type: 'UPDATE_FAVORITE'; payload: { id: string; updates: Partial<FavoriteMeal> } }
  | { type: 'DELETE_FAVORITE'; payload: string };

// Macro nutrient type
export interface MacroNutrient {
  label: string;
  value: number;
  target: number;
  unit: string;
  emoji: string;
  color: string;
}

// AI Analysis Result
export interface AIAnalysisResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  explanation: string;
  confidence?: number;
  sources?: string[];
}

// API Error Type
export interface APIError {
  message: string;
  code?: string;
  retryable: boolean;
}

// Calorie Animation Status Type
export type CalorieAnimationStatus = 'idle' | 'calculating' | 'sources' | 'animating' | 'done';

// ============================================
// AUTH & USER PROFILE TYPES
// ============================================

// Supabase Auth User (simplified from @supabase/supabase-js)
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// User Profile (matches user_profiles table in database)
export interface UserProfile {
  id: string; // References auth.users(id)
  email: string;

  // Physical data (from onboarding - all optional)
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Dietary preferences
  dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
  allergies?: string[];

  // Nutrition goals (migrated from UserSettings)
  daily_calorie_goal: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  target_protein: number;
  target_carbs: number;
  target_fat: number;

  // App preferences
  theme: 'light' | 'dark' | 'auto';
  meal_reminders: boolean;
  track_water: boolean;

  // Privacy & consent
  data_sharing_consent: boolean;
  analytics_enabled: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  last_active?: string;
}

// Onboarding Data (collected before or during signup)
export interface OnboardingData {
  // User info
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Dietary preferences
  dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
  allergies?: string[];

  // Goals
  daily_calorie_goal?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
}

// Auth Error Type
export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

// Favorite Meal (matches favorite_meals table)
export interface FavoriteMeal {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  emoji?: string;
  notes?: string;
  frequency_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}
