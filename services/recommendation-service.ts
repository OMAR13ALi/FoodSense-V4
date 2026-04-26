/**
 * Recommendation Service
 * - Reads today's cached daily_recommendations row (if any)
 * - Builds a RecommendationContext from profile + today's meals + 7-day trend + weight logs
 * - Calls the generate-recommendations edge function (OpenRouter DeepSeek :free)
 * - Upserts the result so the same user+date reuses it
 */

import { supabase } from './supabase-client';
import { formatDateKey } from './storage-service';
import { globalRequestQueue } from './request-queue';
import { getUserProfile } from './profile-service';
import { getRecentDailySummaries } from './database-service';
import { getWeightLogs } from './gamification-service';
import {
  DailyRecommendation,
  RecommendationContext,
  RecommendationMealSuggestion,
  RecommendationPacing,
  RecommendationTip,
  MealEntry,
  UserProfile,
  WeightLog,
} from '../types';

interface DbRow {
  id: string;
  user_id: string;
  date: string;
  pacing: RecommendationPacing;
  meal_suggestions: RecommendationMealSuggestion[];
  tips: RecommendationTip[];
  model: string | null;
  generated_at: string;
}

function rowToRecommendation(row: DbRow): DailyRecommendation {
  return {
    id: row.id,
    date: row.date,
    pacing: row.pacing,
    meal_suggestions: Array.isArray(row.meal_suggestions) ? row.meal_suggestions : [],
    tips: Array.isArray(row.tips) ? row.tips : [],
    generated_at: row.generated_at,
  };
}

async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('User not authenticated');
  return user.id;
}

export async function getTodaysRecommendation(): Promise<DailyRecommendation | null> {
  const userId = await getCurrentUserId();
  const today = formatDateKey(new Date());

  const { data, error } = await supabase
    .from('daily_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.warn('[recommendations] fetch failed:', error.message);
    return null;
  }
  return data ? rowToRecommendation(data as DbRow) : null;
}

/**
 * Sums calories/macros for today's in-memory meals (client side).
 * Caller should pass `state.meals` from AppContext so we include unsaved entries.
 */
function sumMeals(meals: MealEntry[]) {
  return meals.reduce(
    (acc, m) => {
      if (m.isLoading) return acc;
      acc.calories += m.calories || 0;
      acc.protein += m.protein || 0;
      acc.carbs += m.carbs || 0;
      acc.fat += m.fat || 0;
      acc.meals_count += 1;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, meals_count: 0 },
  );
}

function averageSummaries(
  summaries: Array<{ totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number }>,
) {
  if (summaries.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  const sum = summaries.reduce(
    (acc, s) => ({
      calories: acc.calories + s.totalCalories,
      protein: acc.protein + s.totalProtein,
      carbs: acc.carbs + s.totalCarbs,
      fat: acc.fat + s.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const n = summaries.length;
  return {
    calories: Math.round(sum.calories / n),
    protein: Math.round(sum.protein / n),
    carbs: Math.round(sum.carbs / n),
    fat: Math.round(sum.fat / n),
  };
}

/**
 * Recent weight trend in kg/week computed from first and last entry of the last 14 days.
 * Returns undefined if there are fewer than 2 weight logs.
 */
function weightTrendKgPerWeek(logs: WeightLog[]): number | undefined {
  if (logs.length < 2) return undefined;
  const first = logs[0];
  const last = logs[logs.length - 1];
  const firstDate = new Date(first.logged_at).getTime();
  const lastDate = new Date(last.logged_at).getTime();
  const days = (lastDate - firstDate) / 86_400_000;
  if (days <= 0) return undefined;
  const delta = Number(last.weight_kg) - Number(first.weight_kg);
  return Number(((delta / days) * 7).toFixed(3));
}

export function buildContext(
  profile: UserProfile,
  todaysMeals: MealEntry[],
  sevenDaySummaries: Array<{ totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number }>,
  weightLogs: WeightLog[],
): RecommendationContext {
  const today = sumMeals(todaysMeals);
  const avg = averageSummaries(sevenDaySummaries);
  const trend = weightTrendKgPerWeek(weightLogs);
  const currentWeight = weightLogs.length > 0
    ? Number(weightLogs[weightLogs.length - 1].weight_kg)
    : profile.weight_kg;

  return {
    goal_type: profile.goal_type ?? 'maintenance',
    target_weight_kg: profile.target_weight_kg,
    pace_kg_per_week: profile.pace_kg_per_week,
    current_weight_kg: currentWeight,
    daily_calorie_goal: profile.daily_calorie_goal,
    target_protein: profile.target_protein,
    target_carbs: profile.target_carbs,
    target_fat: profile.target_fat,
    activity_level: profile.activity_level,
    dietary_preference: profile.dietary_preference,
    allergies: profile.allergies,
    today: {
      calories: Math.round(today.calories),
      protein: Math.round(today.protein),
      carbs: Math.round(today.carbs),
      fat: Math.round(today.fat),
      meals_count: today.meals_count,
    },
    seven_day_avg: avg,
    recent_weight_trend_kg_per_week: trend,
  };
}

/**
 * Gather profile + summaries + weight logs, build context, then call generate.
 * Returns the stored DailyRecommendation row.
 */
export async function generateTodaysRecommendation(
  todaysMeals: MealEntry[],
): Promise<DailyRecommendation> {
  const [profile, summaries, weightLogs] = await Promise.all([
    getUserProfile(),
    getRecentDailySummaries(7).catch(() => []),
    getWeightLogs(14).catch(() => [] as WeightLog[]),
  ]);

  if (!profile) throw new Error('Profile not found');
  if (!profile.goal_type) throw new Error('No goal set');

  const context = buildContext(profile, todaysMeals, summaries, weightLogs);

  const result = await globalRequestQueue.enqueue(async () => {
    const { data, error } = await supabase.functions.invoke<{
      recommendation: {
        pacing: RecommendationPacing;
        meal_suggestions: RecommendationMealSuggestion[];
        tips: RecommendationTip[];
      };
      model: string;
    }>('generate-recommendations', {
      body: { context },
    });

    if (error) throw error;
    if (!data?.recommendation) throw new Error('Empty recommendation response');
    return data;
  });

  const userId = await getCurrentUserId();
  const today = formatDateKey(new Date());

  const { data: upserted, error: upsertErr } = await supabase
    .from('daily_recommendations')
    .upsert(
      {
        user_id: userId,
        date: today,
        pacing: result.recommendation.pacing,
        meal_suggestions: result.recommendation.meal_suggestions,
        tips: result.recommendation.tips,
        model: result.model,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' },
    )
    .select('*')
    .single();

  if (upsertErr || !upserted) {
    throw new Error(`Failed to save recommendation: ${upsertErr?.message ?? 'unknown'}`);
  }
  return rowToRecommendation(upserted as DbRow);
}
