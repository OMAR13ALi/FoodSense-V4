/**
 * Gamification Service
 * Handles streaks, achievements, weight logging, and TDEE calculation
 */

import { supabase } from './supabase-client';
import { getAllMealDates, getRecentDailySummaries } from './database-service';
import { updateUserProfile } from './profile-service';
import {
  WeightLog, UserAchievement, GoalType, TDEEResult, UserProfile,
  WEIGHT_MILESTONE_PERCENTS,
} from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/constants/achievements';

const STREAK_MILESTONES = [3, 7, 14, 30];

// =====================================================
// STREAK CALCULATION
// =====================================================

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeBestStreak(sortedDatesDesc: string[]): number {
  if (sortedDatesDesc.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDatesDesc.length; i++) {
    const prev = new Date(sortedDatesDesc[i - 1] + 'T00:00:00');
    const curr = new Date(sortedDatesDesc[i] + 'T00:00:00');
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function calculateStreak(allDates: string[]): { currentStreak: number; bestStreak: number } {
  if (allDates.length === 0) return { currentStreak: 0, bestStreak: 0 };

  // Deduplicate and sort descending (most recent first)
  const sorted = [...new Set(allDates)].sort().reverse();

  const todayStr = formatDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);

  const lastLog = sorted[0];
  const bestStreak = computeBestStreak(sorted);

  // Streak is only alive if logged today or yesterday
  if (lastLog !== todayStr && lastLog !== yesterdayStr) {
    return { currentStreak: 0, bestStreak };
  }

  // Walk back counting consecutive days
  let currentStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, bestStreak: Math.max(currentStreak, bestStreak) };
}

/**
 * Calculate streak from DB, save it back to user_profiles, and return whether
 * the streak just crossed a milestone threshold.
 */
export async function calculateAndSaveStreak(): Promise<{
  currentStreak: number;
  bestStreak: number;
  isMilestone: boolean;
}> {
  try {
    const allDates = await getAllMealDates();
    const { currentStreak, bestStreak } = calculateStreak(allDates);

    const todayStr = formatDateKey(new Date());
    await updateUserProfile({
      current_streak: currentStreak,
      best_streak: bestStreak,
      last_streak_date: currentStreak > 0 ? todayStr : undefined,
    } as any);

    const isMilestone = STREAK_MILESTONES.includes(currentStreak);
    return { currentStreak, bestStreak, isMilestone };
  } catch (error) {
    console.warn('[gamification] calculateAndSaveStreak failed:', error);
    return { currentStreak: 0, bestStreak: 0, isMilestone: false };
  }
}

export async function getStreakInfo(): Promise<{ currentStreak: number; bestStreak: number }> {
  try {
    const allDates = await getAllMealDates();
    return calculateStreak(allDates);
  } catch (error) {
    console.warn('[gamification] getStreakInfo failed:', error);
    return { currentStreak: 0, bestStreak: 0 };
  }
}

// =====================================================
// TDEE / GOAL CALORIE CALCULATION
// =====================================================

export const DEFAULT_PACE_KG_PER_WEEK = 0.5;
export const PACE_OPTIONS_KG_PER_WEEK = [0.25, 0.5, 0.75, 1.0] as const;
const KCAL_PER_KG_FAT = 7700; // ~conventional value
const MAX_PACE_KG_PER_WEEK = 1.0;
const AT_GOAL_THRESHOLD_KG = 0.5;

export function calculateTDEE(
  profile: Partial<UserProfile>,
  goalType: GoalType,
  opts: { target_weight_kg?: number; pace_kg_per_week?: number } = {}
): TDEEResult {
  const weight_kg = profile.weight_kg ?? 70;
  const height_cm = profile.height_cm ?? 170;
  const age = profile.age ?? 25;
  const gender = profile.gender ?? 'male';
  const activity_level = profile.activity_level ?? 'moderate';

  // Mifflin-St Jeor BMR
  let bmr: number;
  if (gender === 'female') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  }

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = Math.round(bmr * (multipliers[activity_level] ?? 1.55));

  const pace = Math.min(
    MAX_PACE_KG_PER_WEEK,
    Math.max(0, opts.pace_kg_per_week ?? profile.pace_kg_per_week ?? DEFAULT_PACE_KG_PER_WEEK)
  );
  const dailyKcalPerPace = (pace * KCAL_PER_KG_FAT) / 7;

  const target = opts.target_weight_kg ?? profile.target_weight_kg;
  const gap = target !== undefined ? target - weight_kg : undefined; // +gain / -loss

  let adjustment = 0;
  let effectiveGoal: GoalType = goalType;
  if (goalType === 'weight_loss') {
    if (gap !== undefined && Math.abs(gap) < AT_GOAL_THRESHOLD_KG) {
      effectiveGoal = 'maintenance';
    } else if (gap === undefined || gap < 0) {
      adjustment = -Math.round(dailyKcalPerPace);
    } else {
      // target is above current weight but goal is loss — treat as maintenance
      effectiveGoal = 'maintenance';
    }
  } else if (goalType === 'weight_gain') {
    if (gap !== undefined && Math.abs(gap) < AT_GOAL_THRESHOLD_KG) {
      effectiveGoal = 'maintenance';
    } else if (gap === undefined || gap > 0) {
      adjustment = Math.round(dailyKcalPerPace);
    } else {
      effectiveGoal = 'maintenance';
    }
  } else if (goalType === 'muscle_gain') {
    adjustment = 200;
  } // maintenance → 0

  if (effectiveGoal === 'maintenance') adjustment = 0;

  const recommendedCalories = Math.max(1200, tdee + adjustment);

  let weeksToGoal: number | null = null;
  if (
    gap !== undefined &&
    pace > 0 &&
    Math.abs(gap) >= AT_GOAL_THRESHOLD_KG &&
    (goalType === 'weight_loss' || goalType === 'weight_gain')
  ) {
    weeksToGoal = Math.ceil(Math.abs(gap) / pace);
  }

  return {
    bmr: Math.round(bmr),
    tdee,
    recommendedCalories,
    adjustment,
    paceKgPerWeek: pace,
    weeksToGoal,
  };
}

// =====================================================
// ACHIEVEMENTS
// =====================================================

interface AchievementCheckContext {
  mealDates: string[];
  currentStreak: number;
  calorieGoal: number;
  proteinGoal: number;
}

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
}

export async function getUserAchievements(): Promise<UserAchievement[]> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserAchievement[];
  } catch (error) {
    console.warn('[gamification] getUserAchievements failed:', error);
    return [];
  }
}

/**
 * Check achievement conditions and unlock any newly earned badges.
 * Returns the IDs of newly unlocked achievements (empty if none).
 */
export async function checkAndUnlockAchievements(
  context: AchievementCheckContext
): Promise<string[]> {
  try {
    const userId = await getCurrentUserId();

    // Load already-unlocked achievements
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const alreadyUnlocked = new Set((existing || []).map((r: any) => r.achievement_id));

    // Fetch last 30 days of summaries for goal-based checks
    let summaries: Array<{
      date: string;
      totalCalories: number;
      totalProtein: number;
    }> = [];
    try {
      summaries = await getRecentDailySummaries(30);
    } catch {
      // Non-critical, continue without summaries
    }

    const toUnlock: string[] = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      if (alreadyUnlocked.has(def.id)) continue;

      let earned = false;

      switch (def.id) {
        case 'first_meal':
          earned = context.mealDates.length >= 1;
          break;
        case 'streak_3':
          earned = context.currentStreak >= 3;
          break;
        case 'streak_7':
          earned = context.currentStreak >= 7;
          break;
        case 'streak_14':
          earned = context.currentStreak >= 14;
          break;
        case 'streak_30':
          earned = context.currentStreak >= 30;
          break;
        case 'goal_hit_3': {
          const count = summaries.filter(
            s => s.totalCalories >= context.calorieGoal * 0.9 &&
                 s.totalCalories <= context.calorieGoal * 1.1
          ).length;
          earned = count >= 3;
          break;
        }
        case 'goal_hit_7': {
          const count = summaries.filter(
            s => s.totalCalories >= context.calorieGoal * 0.9 &&
                 s.totalCalories <= context.calorieGoal * 1.1
          ).length;
          earned = count >= 7;
          break;
        }
        case 'protein_champ': {
          const count = summaries.filter(
            s => s.totalProtein >= context.proteinGoal * 0.95
          ).length;
          earned = count >= 5;
          break;
        }
        case 'under_budget_week': {
          const last7 = summaries.slice(0, 7);
          earned = last7.length === 7 &&
            last7.every(s => s.totalCalories > 0 && s.totalCalories <= context.calorieGoal);
          break;
        }
      }

      if (earned) {
        toUnlock.push(def.id);
      }
    }

    if (toUnlock.length === 0) return [];

    // Insert newly unlocked achievements
    const now = new Date().toISOString();
    const rows = toUnlock.map(achievement_id => ({
      user_id: userId,
      achievement_id,
      unlocked_at: now,
    }));

    const { error } = await supabase
      .from('user_achievements')
      .upsert(rows, { onConflict: 'user_id,achievement_id' });

    if (error) {
      console.warn('[gamification] Failed to save achievements:', error);
      return [];
    }

    return toUnlock;
  } catch (error) {
    console.warn('[gamification] checkAndUnlockAchievements failed:', error);
    return [];
  }
}

// =====================================================
// WEIGHT LOGGING
// =====================================================

export async function logWeight(weight_kg: number): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    const today = formatDateKey(new Date());

    const { error } = await supabase
      .from('weight_logs')
      .upsert(
        { user_id: userId, weight_kg, logged_at: today },
        { onConflict: 'user_id,logged_at' }
      );

    if (error) throw error;
  } catch (error: any) {
    console.error('[gamification] logWeight failed:', error);
    throw new Error(`Failed to log weight: ${error.message || 'Unknown error'}`);
  }
}

// =====================================================
// WEIGHT MILESTONE CELEBRATIONS
// =====================================================

export function computeWeightProgress(
  startWeight: number,
  currentWeight: number,
  targetWeight: number
): { progressPct: number; direction: 'loss' | 'gain' } {
  const totalDistance = Math.abs(targetWeight - startWeight);
  if (totalDistance === 0) return { progressPct: 1, direction: 'maintenance' as any };

  const covered = Math.abs(currentWeight - startWeight);
  const progressPct = Math.min(covered / totalDistance, 1);
  const direction = targetWeight < startWeight ? 'loss' : 'gain';
  return { progressPct, direction };
}

export async function checkAndCelebrateMilestones(
  profile: UserProfile,
  weightLogs: WeightLog[]
): Promise<string[]> {
  try {
    if (!profile.target_weight_kg || !profile.weight_kg || weightLogs.length === 0) return [];

    const userId = await getCurrentUserId();
    const startWeight = profile.weight_kg;
    const currentWeight = weightLogs[weightLogs.length - 1].weight_kg;
    const targetWeight = profile.target_weight_kg;

    const { progressPct } = computeWeightProgress(startWeight, currentWeight, targetWeight);
    const celebrated = new Set(profile.celebrated_milestones ?? []);

    const newMilestones: string[] = [];
    for (const [key, threshold] of Object.entries(WEIGHT_MILESTONE_PERCENTS)) {
      if (!celebrated.has(key) && progressPct >= threshold) {
        newMilestones.push(key);
      }
    }

    if (newMilestones.length === 0) return [];

    const updatedMilestones = [...celebrated, ...newMilestones];
    await supabase
      .from('user_profiles')
      .update({ celebrated_milestones: updatedMilestones })
      .eq('id', userId);

    return newMilestones;
  } catch (error) {
    console.warn('[gamification] checkAndCelebrateMilestones failed:', error);
    return [];
  }
}

export async function getWeightLogs(limitDays: number = 90): Promise<WeightLog[]> {
  try {
    const userId = await getCurrentUserId();
    const since = new Date();
    since.setDate(since.getDate() - limitDays);
    const sinceStr = formatDateKey(since);

    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', sinceStr)
      .order('logged_at', { ascending: true });

    if (error) throw error;
    return (data || []) as WeightLog[];
  } catch (error) {
    console.warn('[gamification] getWeightLogs failed:', error);
    return [];
  }
}
