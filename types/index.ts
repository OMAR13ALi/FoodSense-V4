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
  animationSettings: AnimationSettings;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// Action types for context
export type AppAction =
  | { type: 'ADD_MEAL'; payload: MealEntry }
  | { type: 'SET_MEALS'; payload: MealEntry[] }
  | { type: 'UPDATE_MEAL'; payload: { id: string; updates: Partial<MealEntry> } }
  | { type: 'DELETE_MEAL'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'UPDATE_ANIMATION_SETTINGS'; payload: Partial<AnimationSettings> }
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

// Animation Settings Types
export type AnimationIntensity = 'full' | 'balanced' | 'minimal' | 'off';

export interface AnimationSettings {
  intensity: AnimationIntensity;
  haptics: boolean;
  particles: boolean;
  respectSystemSettings: boolean;
}

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

  // Gamification (added in migration 20260410200000)
  goal_type?: GoalType;
  target_weight_kg?: number;
  current_streak?: number;
  best_streak?: number;
  last_streak_date?: string;

  // Weight milestone dedup (added in migration 20260410210000)
  celebrated_milestones?: string[];

  // Weight-change pace (kg/week) used to derive calorie deficit/surplus
  pace_kg_per_week?: number;
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

  // Gamification
  goal_type?: GoalType;
  target_weight_kg?: number;
  pace_kg_per_week?: number;
}

// Auth Error Type
export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

// ============================================
// GAMIFICATION TYPES
// ============================================

export type GoalType = 'weight_loss' | 'maintenance' | 'weight_gain' | 'muscle_gain';

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string; // YYYY-MM-DD
  created_at: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'streak' | 'goal' | 'nutrition' | 'consistency';
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface AchievementWithStatus extends AchievementDefinition {
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number; // 0..1 fraction toward unlock (only meaningful when !unlocked)
  progressLabel?: string; // e.g. "5 / 7"
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  recommendedCalories: number;
  adjustment: number; // positive = surplus, negative = deficit
  paceKgPerWeek: number;
  weeksToGoal: number | null; // null when no target weight or already at goal
}

// ============================================
// WEIGHT MILESTONE CONSTANTS
// ============================================

export const WEIGHT_MILESTONE_PERCENTS: Record<string, number> = {
  '10pct': 0.10,
  '25pct': 0.25,
  '50pct': 0.50,
  '75pct': 0.75,
  '100pct': 1.00,
};

export const WEIGHT_MILESTONE_LABELS: Record<string, string> = {
  '10pct': 'Getting Started',
  '25pct': 'Quarter Way!',
  '50pct': 'Halfway There!',
  '75pct': 'Almost Done!',
  '100pct': 'Goal Reached!',
};

export const WEIGHT_MILESTONE_EMOJIS: Record<string, string> = {
  '10pct': '🎯',
  '25pct': '⭐',
  '50pct': '🏆',
  '75pct': '🔥',
  '100pct': '👑',
};

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
