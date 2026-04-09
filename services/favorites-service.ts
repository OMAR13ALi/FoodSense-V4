import { FavoriteMeal } from '../types';
import { supabase, Database } from './supabase-client';

/**
 * Favorites Service
 * Handles all Supabase database operations for favorite meals
 * NOTE: Requires authentication - all operations require a logged-in user
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

// Database record type
type DbFavoriteMeal = Database['public']['Tables']['favorite_meals']['Row'];
type DbFavoriteMealInsert = Database['public']['Tables']['favorite_meals']['Insert'];
type DbFavoriteMealUpdate = Database['public']['Tables']['favorite_meals']['Update'];

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
 * Convert FavoriteMeal from database format to app format
 */
function favoriteFromDbFormat(dbFavorite: DbFavoriteMeal): FavoriteMeal {
  return {
    id: dbFavorite.id,
    user_id: dbFavorite.user_id,
    name: dbFavorite.name,
    calories: Number(dbFavorite.calories),
    protein: dbFavorite.protein ? Number(dbFavorite.protein) : undefined,
    carbs: dbFavorite.carbs ? Number(dbFavorite.carbs) : undefined,
    fat: dbFavorite.fat ? Number(dbFavorite.fat) : undefined,
    emoji: dbFavorite.emoji ?? undefined,
    notes: dbFavorite.notes ?? undefined,
    frequency_count: Number(dbFavorite.frequency_count),
    last_used_at: dbFavorite.last_used_at ?? undefined,
    created_at: dbFavorite.created_at,
    updated_at: dbFavorite.updated_at,
  };
}

/**
 * Convert FavoriteMeal to database insert format
 */
function favoriteToDbInsertFormat(
  favorite: Partial<FavoriteMeal>,
  userId: string
): DbFavoriteMealInsert {
  return {
    user_id: userId,
    name: favorite.name!,
    calories: favorite.calories!,
    protein: favorite.protein ?? null,
    carbs: favorite.carbs ?? null,
    fat: favorite.fat ?? null,
    emoji: favorite.emoji ?? null,
    notes: favorite.notes ?? null,
    frequency_count: 0,
    last_used_at: null,
  };
}

// =====================================================
// FAVORITES OPERATIONS
// =====================================================

/**
 * Get all favorite meals for the current user
 * Sorted by frequency (most used first), then by name
 */
export async function getFavorites(): Promise<FavoriteMeal[]> {
  const userId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('favorite_meals')
      .select('*')
      .eq('user_id', userId)
      .order('frequency_count', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(favoriteFromDbFormat);
  } catch (error: any) {
    console.error('Failed to load favorites:', error);
    throw new Error(`Failed to load favorites: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get a single favorite meal by ID
 */
export async function getFavoriteById(id: string): Promise<FavoriteMeal | null> {
  const userId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('favorite_meals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data ? favoriteFromDbFormat(data) : null;
  } catch (error: any) {
    console.error('Failed to load favorite:', error);
    throw new Error(`Failed to load favorite: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Search favorite meals by name
 */
export async function searchFavorites(query: string): Promise<FavoriteMeal[]> {
  const userId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('favorite_meals')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('frequency_count', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(favoriteFromDbFormat);
  } catch (error: any) {
    console.error('Failed to search favorites:', error);
    throw new Error(`Failed to search favorites: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Add a new favorite meal
 */
export async function addFavorite(favorite: {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  emoji?: string;
  notes?: string;
}): Promise<FavoriteMeal> {
  const userId = await getCurrentUserId();

  try {
    const favoriteData = favoriteToDbInsertFormat(favorite, userId);

    const { data, error } = await supabase
      .from('favorite_meals')
      .insert(favoriteData)
      .select()
      .single();

    if (error) throw error;

    return favoriteFromDbFormat(data);
  } catch (error: any) {
    console.error('Failed to add favorite:', error);
    throw new Error(`Failed to add favorite: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Update an existing favorite meal
 */
export async function updateFavorite(
  id: string,
  updates: {
    name?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    emoji?: string;
    notes?: string;
  }
): Promise<FavoriteMeal> {
  const userId = await getCurrentUserId();

  try {
    const updateData: DbFavoriteMealUpdate = {
      ...updates,
      protein: updates.protein ?? null,
      carbs: updates.carbs ?? null,
      fat: updates.fat ?? null,
      emoji: updates.emoji ?? null,
      notes: updates.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('favorite_meals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return favoriteFromDbFormat(data);
  } catch (error: any) {
    console.error('Failed to update favorite:', error);
    throw new Error(`Failed to update favorite: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Delete a favorite meal
 */
export async function deleteFavorite(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  try {
    const { error } = await supabase
      .from('favorite_meals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Failed to delete favorite:', error);
    throw new Error(`Failed to delete favorite: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Increment frequency count and update last_used_at
 * Call this when a favorite is used to add a meal
 */
export async function incrementFavoriteUsage(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  try {
    // First get the current frequency count
    const { data: current, error: fetchError } = await supabase
      .from('favorite_meals')
      .select('frequency_count')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Increment and update
    const { error: updateError } = await supabase
      .from('favorite_meals')
      .update({
        frequency_count: (current.frequency_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  } catch (error: any) {
    console.error('Failed to increment favorite usage:', error);
    throw new Error(`Failed to increment favorite usage: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get most frequently used favorites (top N)
 */
export async function getTopFavorites(limit: number = 5): Promise<FavoriteMeal[]> {
  const userId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('favorite_meals')
      .select('*')
      .eq('user_id', userId)
      .order('frequency_count', { ascending: false })
      .order('last_used_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(favoriteFromDbFormat);
  } catch (error: any) {
    console.error('Failed to load top favorites:', error);
    throw new Error(`Failed to load top favorites: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get recently used favorites
 */
export async function getRecentFavorites(limit: number = 5): Promise<FavoriteMeal[]> {
  const userId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('favorite_meals')
      .select('*')
      .eq('user_id', userId)
      .not('last_used_at', 'is', null)
      .order('last_used_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(favoriteFromDbFormat);
  } catch (error: any) {
    console.error('Failed to load recent favorites:', error);
    throw new Error(`Failed to load recent favorites: ${error.message || 'Unknown error'}`);
  }
}
