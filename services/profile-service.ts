/**
 * Profile Service
 * Handles user profile operations with the user_profiles table
 */

import { supabase } from './supabase-client';
import { UserProfile, GoalType } from '../types';

/**
 * Get current user's profile
 * Returns null if profile doesn't exist
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // PGRST116 means no rows found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as UserProfile;
  } catch (error: any) {
    console.error('Failed to get user profile:', error);
    throw new Error(`Failed to get profile: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Update user profile data
 * Updates physical stats, dietary preferences, nutrition goals, and app preferences
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Add updated_at timestamp
    const profileData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', user.id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    throw new Error(`Failed to update profile: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Update physical stats only
 */
export async function updatePhysicalStats(data: {
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}): Promise<void> {
  return updateUserProfile(data);
}

/**
 * Update dietary preferences
 */
export async function updateDietaryPreferences(data: {
  dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
  allergies?: string[];
}): Promise<void> {
  return updateUserProfile(data);
}

/**
 * Update nutrition goals
 */
export async function updateNutritionGoals(data: {
  daily_calorie_goal?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}): Promise<void> {
  return updateUserProfile(data);
}

/**
 * Update app preferences
 */
export async function updateAppPreferences(data: {
  theme?: 'light' | 'dark' | 'auto';
  meal_reminders?: boolean;
  track_water?: boolean;
}): Promise<void> {
  return updateUserProfile(data);
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(data: {
  data_sharing_consent?: boolean;
  analytics_enabled?: boolean;
}): Promise<void> {
  return updateUserProfile(data);
}

/**
 * Update goal type and optional target weight
 */
export async function updateGoalType(
  goalType: GoalType,
  targetWeightKg?: number
): Promise<void> {
  const updates: Partial<UserProfile> = { goal_type: goalType };
  if (targetWeightKg !== undefined) {
    updates.target_weight_kg = targetWeightKg;
  }
  return updateUserProfile(updates);
}

/**
 * Save computed streak values back to the profile row
 */
export async function updateStreakInProfile(
  currentStreak: number,
  bestStreak: number
): Promise<void> {
  return updateUserProfile({ current_streak: currentStreak, best_streak: bestStreak } as any);
}

/**
 * Update last active timestamp
 * Call this periodically to track user activity
 */
export async function updateLastActive(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return; // Silent fail if not authenticated

    await supabase
      .from('user_profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', user.id);
  } catch (error) {
    // Silent fail - this is not critical
    console.warn('Failed to update last active:', error);
  }
}
