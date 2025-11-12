/**
 * Storage Service - Supabase Cloud Database
 * Handles saving and loading app data to/from Supabase with debouncing
 */

import { MealEntry, UserSettings } from '@/types';
import * as DatabaseService from './database-service';

// Debounce timers
let saveMealsTimer: NodeJS.Timeout | null = null;
let saveSettingsTimer: NodeJS.Timeout | null = null;

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 2000; // 2 seconds

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Save meals for a specific date (debounced)
 * This function debounces saves to prevent excessive network requests
 */
export async function saveMeals(meals: MealEntry[], date: Date = new Date()): Promise<void> {
  return new Promise((resolve, reject) => {
    // Clear existing timer
    if (saveMealsTimer) {
      clearTimeout(saveMealsTimer);
    }

    // Set new timer
    saveMealsTimer = setTimeout(async () => {
      try {
        await DatabaseService.saveMeals(meals, date);
        resolve();
      } catch (error) {
        console.error('Error saving meals:', error);
        reject(error);
      }
    }, DEBOUNCE_DELAY);
  });
}

/**
 * Save meals immediately (bypass debounce)
 * Use this when you need to force an immediate save
 */
export async function saveMealsImmediate(meals: MealEntry[], date: Date = new Date()): Promise<void> {
  // Clear any pending debounced save
  if (saveMealsTimer) {
    clearTimeout(saveMealsTimer);
    saveMealsTimer = null;
  }

  try {
    await DatabaseService.saveMeals(meals, date);
  } catch (error) {
    console.error('Error saving meals immediately:', error);
    throw error;
  }
}

/**
 * Load meals for a specific date
 */
export async function loadMeals(date: Date = new Date()): Promise<MealEntry[]> {
  try {
    return await DatabaseService.loadMeals(date);
  } catch (error) {
    console.error('Error loading meals:', error);
    throw error;
  }
}

/**
 * Delete meals for a specific date
 */
export async function deleteMeals(date: Date = new Date()): Promise<void> {
  try {
    await DatabaseService.deleteMeals(date);
  } catch (error) {
    console.error('Error deleting meals:', error);
    throw error;
  }
}

/**
 * Get all dates that have stored meals
 */
export async function getAllMealDates(): Promise<string[]> {
  try {
    return await DatabaseService.getAllMealDates();
  } catch (error) {
    console.error('Error getting meal dates:', error);
    throw error;
  }
}

/**
 * Save user settings (debounced)
 * This function debounces saves to prevent excessive network requests
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    // Clear existing timer
    if (saveSettingsTimer) {
      clearTimeout(saveSettingsTimer);
    }

    // Set new timer
    saveSettingsTimer = setTimeout(async () => {
      try {
        await DatabaseService.saveSettings(settings);
        resolve();
      } catch (error) {
        console.error('Error saving settings:', error);
        reject(error);
      }
    }, DEBOUNCE_DELAY);
  });
}

/**
 * Save settings immediately (bypass debounce)
 * Use this when you need to force an immediate save
 */
export async function saveSettingsImmediate(settings: UserSettings): Promise<void> {
  // Clear any pending debounced save
  if (saveSettingsTimer) {
    clearTimeout(saveSettingsTimer);
    saveSettingsTimer = null;
  }

  try {
    await DatabaseService.saveSettings(settings);
  } catch (error) {
    console.error('Error saving settings immediately:', error);
    throw error;
  }
}

/**
 * Load user settings
 */
export async function loadSettings(): Promise<UserSettings | null> {
  try {
    return await DatabaseService.loadSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
    throw error;
  }
}

/**
 * Clear all app data (use with caution)
 */
export async function clearAllData(): Promise<void> {
  try {
    await DatabaseService.clearAllData();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalMealDays: number;
  lastSync: Date | null;
  deviceId: string;
}> {
  try {
    return await DatabaseService.getStorageStats();
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw error;
  }
}

/**
 * Delete old meal data (keep only recent days)
 */
export async function cleanupOldMeals(daysToKeep: number = 90): Promise<void> {
  try {
    await DatabaseService.cleanupOldMeals(daysToKeep);
  } catch (error) {
    console.error('Error cleaning up old meals:', error);
    throw error;
  }
}

/**
 * Export all data for backup
 */
export async function exportAllData(): Promise<string> {
  try {
    return await DatabaseService.exportAllData();
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Import data from backup
 */
export async function importAllData(jsonData: string): Promise<void> {
  try {
    await DatabaseService.importAllData(jsonData);
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}
