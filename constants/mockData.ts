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

// Color palette - Blue gradient modern design
export const COLORS = {
  light: {
    background: '#F7FAFC',        // Very light blue-gray
    cardBackground: '#FFFFFF',     // Pure white cards
    primary: '#4A90E2',           // Main blue
    primaryStart: '#4A90E2',      // Medium blue (gradient start)
    primaryEnd: '#357ABD',        // Deeper blue (gradient end)
    accentStart: '#5DADE2',       // Light cyan-blue (gradient start)
    accentEnd: '#3498DB',         // Bright blue (gradient end)
    secondary: '#EBF5FB',         // Very light blue tint
    text: '#1C1C1E',              // Apple dark gray
    textSecondary: '#8E8E93',     // Apple medium gray
    border: '#E5E5EA',            // Apple light gray
    success: '#34C759',           // Apple green
    warning: '#FF9500',           // Apple orange
    error: '#FF3B30',             // Apple red
    caloriePositive: '#5DADE2',   // Light blue for calories
    progressGradientStart: '#667EEA', // Purple-blue
    progressGradientEnd: '#764BA2',   // Deep purple
    shadow: 'rgba(74, 144, 226, 0.08)', // Blue-tinted shadow
    placeholder: '#C7C7CC',       // Apple placeholder gray
  },
  dark: {
    background: '#000000',        // True black (Apple style)
    cardBackground: '#1C1C1E',    // Dark gray cards
    primary: '#5DADE2',           // Light blue
    primaryStart: '#5DADE2',      // Light cyan-blue (gradient start)
    primaryEnd: '#4A90E2',        // Medium blue (gradient end)
    accentStart: '#3498DB',       // Bright blue (gradient start)
    accentEnd: '#2E7BB7',         // Darker blue (gradient end)
    secondary: '#1A2332',         // Dark blue-gray
    text: '#FFFFFF',              // White text
    textSecondary: '#98989D',     // Medium gray
    border: '#38383A',            // Dark border
    success: '#30D158',           // Apple green (dark)
    warning: '#FF9F0A',           // Apple orange (dark)
    error: '#FF453A',             // Apple red (dark)
    caloriePositive: '#5DADE2',   // Light blue for calories
    progressGradientStart: '#667EEA',
    progressGradientEnd: '#764BA2',
    shadow: 'rgba(93, 173, 226, 0.15)', // Blue-tinted shadow
    placeholder: '#48484A',       // Dark placeholder
  },
};
