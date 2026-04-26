import { MealEntry, UserSettings, Food, PortionUnit } from '../types';
import { supabase, Database } from './supabase-client';

// =====================================================
// FOODS OPERATIONS (Phase 2)
// =====================================================

interface DbFoodRow {
  id: string;
  canonical_name: string;
  display_name: string;
  per_100g_calories: number | string;
  per_100g_protein: number | string;
  per_100g_carbs: number | string;
  per_100g_fat: number | string;
  default_serving_g: number | string;
  default_serving_unit: string;
  density_g_per_ml: number | string | null;
  region: string | null;
  confidence: number | string | null;
  sources: string[] | null;
  provider: string | null;
  description: string | null;
}

function dbFoodToFood(row: DbFoodRow): Food {
  return {
    canonicalName: row.canonical_name,
    displayName: row.display_name,
    per100g: {
      calories: Number(row.per_100g_calories),
      protein: Number(row.per_100g_protein),
      carbs: Number(row.per_100g_carbs),
      fat: Number(row.per_100g_fat),
    },
    defaultServingG: Number(row.default_serving_g),
    defaultServingUnit: row.default_serving_unit as PortionUnit,
    densityGPerMl: row.density_g_per_ml != null ? Number(row.density_g_per_ml) : undefined,
    region: row.region ?? undefined,
    confidence: row.confidence != null ? Number(row.confidence) : 0.8,
    sources: row.sources ?? [],
    provider: (row.provider as Food['provider']) ?? undefined,
    explanation: row.description ?? undefined,
  };
}

interface DbFoodOverride {
  per_100g_calories: number | string | null;
  per_100g_protein: number | string | null;
  per_100g_carbs: number | string | null;
  per_100g_fat: number | string | null;
  default_serving_g: number | string | null;
}

function applyOverride(food: Food, override: DbFoodOverride): Food {
  return {
    ...food,
    per100g: {
      calories: override.per_100g_calories != null ? Number(override.per_100g_calories) : food.per100g.calories,
      protein:  override.per_100g_protein  != null ? Number(override.per_100g_protein)  : food.per100g.protein,
      carbs:    override.per_100g_carbs    != null ? Number(override.per_100g_carbs)    : food.per100g.carbs,
      fat:      override.per_100g_fat      != null ? Number(override.per_100g_fat)      : food.per100g.fat,
    },
    defaultServingG: override.default_serving_g != null ? Number(override.default_serving_g) : food.defaultServingG,
  };
}

export async function upsertUserFoodOverride(
  foodId: string,
  override: {
    per100gCalories?: number;
    per100gProtein?: number;
    per100gCarbs?: number;
    per100gFat?: number;
    defaultServingG?: number;
  },
): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('user_food_overrides')
    .upsert({
      user_id: userId,
      food_id: foodId,
      per_100g_calories: override.per100gCalories ?? null,
      per_100g_protein: override.per100gProtein ?? null,
      per_100g_carbs: override.per100gCarbs ?? null,
      per_100g_fat: override.per100gFat ?? null,
      default_serving_g: override.defaultServingG ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,food_id' });
  if (error) throw error;
}

export async function lookupFoodByAlias(canonicalKey: string): Promise<Food | null> {
  const normalized = canonicalKey.trim().toLowerCase();
  if (!normalized) return null;

  const { data: aliasRow } = await supabase
    .from('food_aliases')
    .select('food_id')
    .eq('alias', normalized)
    .maybeSingle();

  let foodRow: DbFoodRow | null = null;
  if (aliasRow?.food_id) {
    const { data } = await supabase.from('foods').select('*').eq('id', aliasRow.food_id).maybeSingle();
    foodRow = (data as unknown as DbFoodRow) ?? null;
  } else {
    const { data } = await supabase.from('foods').select('*').eq('canonical_name', normalized).maybeSingle();
    foodRow = (data as unknown as DbFoodRow) ?? null;
  }
  if (!foodRow) return null;

  let food: Food = { ...dbFoodToFood(foodRow), id: foodRow.id };

  try {
    const userId = await getCurrentUserId();
    const { data: override } = await supabase
      .from('user_food_overrides')
      .select('per_100g_calories, per_100g_protein, per_100g_carbs, per_100g_fat, default_serving_g')
      .eq('user_id', userId)
      .eq('food_id', foodRow.id)
      .maybeSingle();
    if (override) {
      food = applyOverride(food, override as DbFoodOverride);
    }
  } catch {
    // unauthenticated read → no overrides applied
  }

  return food;
}

/**
 * Database Service
 * Handles all Supabase database operations for meals and settings
 * NOTE: Requires authentication - all operations require a logged-in user
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

// Database record types
type DbMeal = Database['public']['Tables']['meals']['Row'];
type DbUserSettings = Database['public']['Tables']['user_settings']['Row'];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get current authenticated user ID
 * Throws error if user is not authenticated
 */
async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated. Please log in to continue.');
    }
    return user.id;
  } catch (error: any) {
    console.error('Error getting current user:', error);
    throw new Error('Authentication required. Please log in to continue.');
  }
}

/**
 * Convert MealEntry from app format to database format
 */
function mealToDbFormat(meal: MealEntry, userId: string) {
  return {
    id: meal.id,
    user_id: userId,
    text: meal.text,
    calories: meal.calories,
    protein: meal.protein ?? null,
    carbs: meal.carbs ?? null,
    fat: meal.fat ?? null,
    timestamp: meal.timestamp.toISOString(),
    ai_explanation: meal.aiExplanation ?? null,
    confidence: meal.confidence ?? null,
    sources: meal.sources ?? null,
    food_id: meal.foodId ?? null,
    quantity: meal.quantity ?? null,
    unit: meal.unit ?? null,
    serving_size_g: meal.servingSizeG ?? null,
  };
}

/**
 * Convert meal from database format to app format
 */
function mealFromDbFormat(dbMeal: DbMeal): MealEntry {
  const anyMeal = dbMeal as any;
  return {
    id: dbMeal.id,
    text: dbMeal.text,
    calories: Number(dbMeal.calories),
    protein: dbMeal.protein ? Number(dbMeal.protein) : undefined,
    carbs: dbMeal.carbs ? Number(dbMeal.carbs) : undefined,
    fat: dbMeal.fat ? Number(dbMeal.fat) : undefined,
    timestamp: new Date(dbMeal.timestamp),
    aiExplanation: dbMeal.ai_explanation ?? undefined,
    confidence: dbMeal.confidence ? Number(dbMeal.confidence) : undefined,
    sources: dbMeal.sources ?? undefined,
    foodId: anyMeal.food_id ?? undefined,
    quantity: anyMeal.quantity != null ? Number(anyMeal.quantity) : undefined,
    unit: anyMeal.unit ?? undefined,
    servingSizeG: anyMeal.serving_size_g != null ? Number(anyMeal.serving_size_g) : undefined,
  };
}

/**
 * Convert UserSettings from app format to database format
 */
function settingsToDbFormat(settings: UserSettings, userId: string) {
  return {
    user_id: userId,
    daily_calorie_goal: settings.dailyCalorieGoal,
    target_protein: settings.targetProtein,
    target_carbs: settings.targetCarbs,
    target_fat: settings.targetFat,
    meal_reminders: settings.mealReminders,
    track_water: settings.trackWater,
    dark_mode: settings.darkMode,
  };
}

/**
 * Convert settings from database format to app format
 */
function settingsFromDbFormat(dbSettings: DbUserSettings): UserSettings {
  return {
    dailyCalorieGoal: Number(dbSettings.daily_calorie_goal),
    targetProtein: Number(dbSettings.target_protein),
    targetCarbs: Number(dbSettings.target_carbs),
    targetFat: Number(dbSettings.target_fat),
    mealReminders: dbSettings.meal_reminders,
    trackWater: dbSettings.track_water,
    darkMode: dbSettings.dark_mode,
  };
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start and end of day in ISO format for queries
 */
function getDayBounds(date: Date): { start: string; end: string } {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  };
}

// =====================================================
// MEALS OPERATIONS
// =====================================================

/**
 * Save meals for a specific date using upsert (prevents duplicate key errors)
 */
export async function saveMeals(meals: MealEntry[], date: Date = new Date()): Promise<void> {
  const userId = await getCurrentUserId();
  const { start, end } = getDayBounds(date);

  try {
    // First, delete any meals not in the current meals array
    const mealIds = meals.map(m => m.id);
    if (mealIds.length > 0) {
      await supabase
        .from('meals')
        .delete()
        .eq('user_id', userId)
        .gte('timestamp', start)
        .lte('timestamp', end)
        .not('id', 'in', `(${mealIds.map(id => `"${id}"`).join(',')})`);
    } else {
      // No meals - delete all for this date
      await supabase
        .from('meals')
        .delete()
        .eq('user_id', userId)
        .gte('timestamp', start)
        .lte('timestamp', end);
    }

    // Upsert all meals (insert or update if exists)
    if (meals.length > 0) {
      const mealsToUpsert = meals.map((meal) => mealToDbFormat(meal, userId));

      const { error: upsertError } = await supabase
        .from('meals')
        .upsert(mealsToUpsert, { onConflict: 'id' });

      if (upsertError) throw upsertError;
    }
  } catch (error: any) {
    console.error('Failed to save meals:', error);
    throw new Error(`Failed to save meals: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Immediately save meals without debouncing (for logout/app backgrounding)
 */
export async function saveMealsImmediate(meals: MealEntry[], date: Date = new Date()): Promise<void> {
  return saveMeals(meals, date);
}

/**
 * Load meals for a specific date
 */
export async function loadMeals(date: Date = new Date()): Promise<MealEntry[]> {
  const userId = await getCurrentUserId();
  const { start, end } = getDayBounds(date);

  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return (data || []).map(mealFromDbFormat);
  } catch (error: any) {
    console.error('Failed to load meals:', error);
    throw new Error(`Failed to load meals: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Delete all meals for a specific date
 */
export async function deleteMeals(date: Date = new Date()): Promise<void> {
  const userId = await getCurrentUserId();
  const { start, end } = getDayBounds(date);

  try {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('user_id', userId)
      .gte('timestamp', start)
      .lte('timestamp', end);

    if (error) throw error;
  } catch (error: any) {
    console.error('Failed to delete meals:', error);
    throw new Error(`Failed to delete meals: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get all dates that have meals stored
 */
export async function getAllMealDates(): Promise<string[]> {
  const userId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('meals')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Extract unique dates in YYYY-MM-DD format
    const dates = new Set<string>();
    (data || []).forEach((meal) => {
      const date = new Date(meal.timestamp);
      dates.add(formatDateKey(date));
    });

    return Array.from(dates);
  } catch (error: any) {
    console.error('Failed to get meal dates:', error);
    throw new Error(`Failed to get meal dates: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Load meals for a date range
 */
export async function loadMealsForDateRange(startDate: Date, endDate: Date): Promise<MealEntry[]> {
  const userId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return (data || []).map(mealFromDbFormat);
  } catch (error: any) {
    console.error('Failed to load meals for date range:', error);
    throw new Error(`Failed to load meals for date range: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get daily summaries for a date range
 * Returns aggregated nutrition data grouped by date
 */
export async function getDailySummaries(startDate: Date, endDate: Date): Promise<Array<{
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}>> {
  const userId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('meals')
      .select('timestamp, calories, protein, carbs, fat')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Group meals by date and calculate totals
    const summariesMap = new Map<string, {
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFat: number;
      mealCount: number;
    }>();

    (data || []).forEach((meal) => {
      const date = formatDateKey(new Date(meal.timestamp));
      const existing = summariesMap.get(date) || {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealCount: 0,
      };

      summariesMap.set(date, {
        totalCalories: existing.totalCalories + Number(meal.calories),
        totalProtein: existing.totalProtein + (meal.protein ? Number(meal.protein) : 0),
        totalCarbs: existing.totalCarbs + (meal.carbs ? Number(meal.carbs) : 0),
        totalFat: existing.totalFat + (meal.fat ? Number(meal.fat) : 0),
        mealCount: existing.mealCount + 1,
      });
    });

    // Convert map to array
    return Array.from(summariesMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  } catch (error: any) {
    console.error('Failed to get daily summaries:', error);
    throw new Error(`Failed to get daily summaries: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get last N days of daily summaries
 */
export async function getRecentDailySummaries(days: number = 7): Promise<Array<{
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}>> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return getDailySummaries(startDate, endDate);
}

// =====================================================
// SETTINGS OPERATIONS
// =====================================================

/**
 * Save user settings
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  const userId = await getCurrentUserId();

  try {
    const settingsData = settingsToDbFormat(settings, userId);

    // Upsert (insert or update) using user_id as primary key
    const { error } = await supabase
      .from('user_settings')
      .upsert(settingsData, { onConflict: 'user_id' });

    if (error) throw error;
  } catch (error: any) {
    console.error('Failed to save settings:', error);
    throw new Error(`Failed to save settings: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Load user settings
 * Returns null if no settings exist for this user
 */
export async function loadSettings(): Promise<UserSettings | null> {
  const userId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 means no rows found - this is expected for new users
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data ? settingsFromDbFormat(data) : null;
  } catch (error: any) {
    console.error('Failed to load settings:', error);
    throw new Error(`Failed to load settings: ${error.message || 'Unknown error'}`);
  }
}

// =====================================================
// UTILITY OPERATIONS
// =====================================================

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalMealDays: number;
  lastSyncDate: Date | null;
  userId: string;
}> {
  const userId = await getCurrentUserId();

  try {
    // Get all meal dates
    const dates = await getAllMealDates();

    // Get most recent meal timestamp as "last sync"
    const { data, error } = await supabase
      .from('meals')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return {
      totalMealDays: dates.length,
      lastSyncDate: data ? new Date(data.timestamp) : null,
      userId: userId,
    };
  } catch (error: any) {
    console.error('Failed to get storage stats:', error);
    throw new Error(`Failed to get storage stats: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Clean up old meals (older than specified days)
 */
export async function cleanupOldMeals(daysToKeep: number): Promise<void> {
  const userId = await getCurrentUserId();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('user_id', userId)
      .lt('timestamp', cutoffDate.toISOString());

    if (error) throw error;
  } catch (error: any) {
    console.error('Failed to cleanup old meals:', error);
    throw new Error(`Failed to cleanup old meals: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Clear all data for this user
 * WARNING: This is destructive and cannot be undone
 */
export async function clearAllData(): Promise<void> {
  const userId = await getCurrentUserId();

  try {
    // Delete all meals
    const { error: mealsError } = await supabase
      .from('meals')
      .delete()
      .eq('user_id', userId);
    if (mealsError) throw mealsError;

    // Delete settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId);
    if (settingsError) throw settingsError;

    // Delete daily summaries
    const { error: summariesError } = await supabase
      .from('daily_summaries')
      .delete()
      .eq('user_id', userId);
    if (summariesError) throw summariesError;
  } catch (error: any) {
    console.error('Failed to clear all data:', error);
    throw new Error(`Failed to clear all data: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Export all data as JSON string (for backup)
 */
export async function exportAllData(): Promise<string> {
  const userId = await getCurrentUserId();

  try {
    // Get all meals
    const { data: mealsData, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });

    if (mealsError) throw mealsError;

    // Get settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Ignore not found error for settings
    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      userId: userId,
      meals: mealsData || [],
      settings: settingsData || null,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error: any) {
    console.error('Failed to export data:', error);
    throw new Error(`Failed to export data: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Import data from JSON backup
 * WARNING: This will overwrite existing data
 */
export async function importAllData(jsonData: string): Promise<void> {
  try {
    const importData = JSON.parse(jsonData);

    // Import settings if present
    if (importData.settings) {
      const settings = settingsFromDbFormat(importData.settings);
      await saveSettings(settings);
    }

    // Import meals if present
    if (importData.meals && Array.isArray(importData.meals)) {
      const meals = importData.meals.map(mealFromDbFormat);

      // Group meals by date and save
      const mealsByDate = new Map<string, MealEntry[]>();
      meals.forEach((meal: any) => {
        const dateKey = formatDateKey(meal.timestamp);
        if (!mealsByDate.has(dateKey)) {
          mealsByDate.set(dateKey, []);
        }
        mealsByDate.get(dateKey)!.push(meal);
      });

      // Save each date's meals
      for (const [dateKey, dateMeals] of mealsByDate) {
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        await saveMeals(dateMeals, date);
      }
    }
  } catch (error: any) {
    console.error('Failed to import data:', error);
    throw new Error(`Failed to import data: ${error.message || 'Unknown error'}`);
  }
}
