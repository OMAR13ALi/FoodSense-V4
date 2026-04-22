/**
 * Mock data for Phase 1 UI implementation
 */

import { MealEntry, UserSettings } from '@/types';

// Default user settings
export const DEFAULT_SETTINGS: UserSettings = {
  dailyCalorieGoal: 2000,
  targetProtein: 150,
  targetCarbs: 250,
  targetFat: 65,
  mealReminders: false,
  trackWater: true,
  darkMode: false,
};

// Sample meal entries for initial state
export const SAMPLE_MEALS: MealEntry[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    text: 'Chicken breast with rice and vegetables',
    calories: 520,
    protein: 45,
    carbs: 58,
    fat: 8,
    timestamp: new Date(new Date().setHours(12, 30, 0, 0)),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    text: 'Greek yogurt with berries and granola',
    calories: 280,
    protein: 18,
    carbs: 42,
    fat: 6,
    timestamp: new Date(new Date().setHours(8, 15, 0, 0)),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    text: 'Salmon salad with olive oil dressing',
    calories: 450,
    protein: 35,
    carbs: 12,
    fat: 28,
    timestamp: new Date(new Date().setHours(18, 45, 0, 0)),
  },
];

// Emoji indicators for macros
export const MACRO_EMOJIS = {
  calories: '🔥',
  protein: '🥩',
  carbs: '🥖',
  fat: '💧',
  water: '💧',
  meals: '🍽️',
};

// Loading state emojis for search animation
export const LOADING_EMOJIS = ['🔍', '🤔', '💭', '🧠', '✨'];

// Color palette — sourced from design tokens (`constants/design.ts`).
// Shape preserved for backwards compatibility with existing call sites.
import { designColors } from './design';

const buildColors = (mode: 'light' | 'dark') => {
  const c = designColors[mode];
  return {
    background: c.bg.canvas,
    cardBackground: c.bg.surface,
    primary: c.accent,
    primaryStart: c.accent,
    primaryEnd: c.accentDeep,
    accentStart: mode === 'light' ? '#60A5FA' : '#93C5FD',
    accentEnd: c.accent,
    secondary: c.accentTint,
    text: c.text.primary,
    textSecondary: c.text.secondary,
    border: c.hairline,
    success: c.success,
    warning: c.warning,
    error: c.error,
    caloriePositive: c.accent,
    progressGradientStart: '#2563EB',
    progressGradientEnd: '#60A5FA',
    shadow: c.shadow,
    placeholder: c.placeholder,
  };
};

export const COLORS = {
  light: buildColors('light'),
  dark: buildColors('dark'),
};
