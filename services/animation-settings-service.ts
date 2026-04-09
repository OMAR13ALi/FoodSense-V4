/**
 * Animation Settings Storage Service
 * Handles persistence of user animation preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimationSettings } from '@/types';

const ANIMATION_SETTINGS_KEY = '@calorie_app:animation_settings';

// Default animation settings
export const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  intensity: 'full',
  haptics: true,
  particles: true,
  respectSystemSettings: true,
};

/**
 * Load animation settings from AsyncStorage
 */
export async function loadAnimationSettings(): Promise<AnimationSettings> {
  try {
    const stored = await AsyncStorage.getItem(ANIMATION_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_ANIMATION_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('[AnimationSettings] Failed to load:', error);
  }
  return DEFAULT_ANIMATION_SETTINGS;
}

/**
 * Save animation settings to AsyncStorage
 */
export async function saveAnimationSettings(settings: AnimationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(ANIMATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[AnimationSettings] Failed to save:', error);
    throw error;
  }
}

/**
 * Clear animation settings (reset to defaults)
 */
export async function clearAnimationSettings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ANIMATION_SETTINGS_KEY);
  } catch (error) {
    console.error('[AnimationSettings] Failed to clear:', error);
    throw error;
  }
}
