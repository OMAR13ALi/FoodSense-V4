import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  calculateAndSaveStreak,
  getUserAchievements,
  getWeightLogs,
  checkAndUnlockAchievements,
  checkAndCelebrateMilestones,
} from '@/services/gamification-service';
import { getAllMealDates, getRecentDailySummaries } from '@/services/database-service';
import { UserAchievement, WeightLog, AchievementWithStatus } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/constants/achievements';
import { useApp } from '@/contexts/AppContext';
import { useHaptics } from '@/hooks/useHaptics';
import Toast from 'react-native-toast-message';
import * as ProfileService from '@/services/profile-service';

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  achievements: AchievementWithStatus[];
  weightLogs: WeightLog[];
  isLoading: boolean;
  // Weight milestones
  newlyTriggeredMilestones: string[];
  mealDates: string[];
}

export function useStreakData(): StreakData {
  const { state } = useApp();
  const haptics = useHaptics();

  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyTriggeredMilestones, setNewlyTriggeredMilestones] = useState<string[]>([]);
  const [mealDates, setMealDates] = useState<string[]>([]);
  const [recentSummaries, setRecentSummaries] = useState<Array<{
    date: string;
    totalCalories: number;
    totalProtein: number;
  }>>([]);

  useFocusEffect(
    useCallback(() => {
      loadGamificationData();
    }, [])
  );

  const loadGamificationData = async () => {
    setIsLoading(true);
    try {
      const [streakResult, rawAchievements, logs, dates, profile, summaries] = await Promise.all([
        calculateAndSaveStreak(),
        getUserAchievements(),
        getWeightLogs(90),
        getAllMealDates(),
        ProfileService.getUserProfile(),
        getRecentDailySummaries(30).catch(() => [] as any[]),
      ]);

      setCurrentStreak(streakResult.currentStreak);
      setBestStreak(streakResult.bestStreak);
      setWeightLogs(logs);
      setMealDates(dates);
      setRecentSummaries(summaries);

      // Fire milestone celebration
      if (streakResult.isMilestone && streakResult.currentStreak > 0) {
        haptics.trigger('notification');
        Toast.show({
          type: 'success',
          text1: `🔥 ${streakResult.currentStreak}-Day Streak!`,
          text2: "You're on fire! Keep it up!",
          position: 'top',
          visibilityTime: 3000,
        });
      }

      // Check for newly unlocked achievements
      const newlyUnlocked = await checkAndUnlockAchievements({
        mealDates: dates,
        currentStreak: streakResult.currentStreak,
        calorieGoal: state.settings.dailyCalorieGoal,
        proteinGoal: state.settings.targetProtein,
      });

      // Reload achievements after unlocking
      const finalAchievements = newlyUnlocked.length > 0
        ? await getUserAchievements()
        : rawAchievements;

      // Show toast for each newly unlocked achievement
      for (const id of newlyUnlocked) {
        const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === id);
        if (def) {
          haptics.trigger('notification');
          Toast.show({
            type: 'success',
            text1: `${def.emoji} Achievement Unlocked!`,
            text2: def.title,
            position: 'top',
            visibilityTime: 3000,
          });
        }
      }

      setUnlockedAchievements(finalAchievements);

      // Check weight milestones
      if (profile) {
        const triggered = await checkAndCelebrateMilestones(profile, logs);
        if (triggered.length > 0) {
          haptics.trigger('notification');
          setNewlyTriggeredMilestones(triggered);
        }
      }
    } catch (error) {
      console.warn('[useStreakData] Failed to load gamification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Precompute counts used for locked-achievement progress
  const calorieGoal = state.settings.dailyCalorieGoal;
  const proteinGoal = state.settings.targetProtein;
  const goalHitCount = recentSummaries.filter(
    s => calorieGoal > 0 &&
         s.totalCalories >= calorieGoal * 0.9 &&
         s.totalCalories <= calorieGoal * 1.1
  ).length;
  const proteinHitCount = recentSummaries.filter(
    s => proteinGoal > 0 && s.totalProtein >= proteinGoal * 0.95
  ).length;
  const last7UnderCount = recentSummaries.slice(0, 7).filter(
    s => calorieGoal > 0 && s.totalCalories > 0 && s.totalCalories <= calorieGoal
  ).length;

  const computeProgress = (id: string): { progress: number; label: string } | null => {
    switch (id) {
      case 'first_meal':
        return { progress: mealDates.length >= 1 ? 1 : 0, label: `${Math.min(mealDates.length, 1)} / 1` };
      case 'streak_3':
        return { progress: Math.min(currentStreak / 3, 1), label: `${Math.min(currentStreak, 3)} / 3` };
      case 'streak_7':
        return { progress: Math.min(currentStreak / 7, 1), label: `${Math.min(currentStreak, 7)} / 7` };
      case 'streak_14':
        return { progress: Math.min(currentStreak / 14, 1), label: `${Math.min(currentStreak, 14)} / 14` };
      case 'streak_30':
        return { progress: Math.min(currentStreak / 30, 1), label: `${Math.min(currentStreak, 30)} / 30` };
      case 'goal_hit_3':
        return { progress: Math.min(goalHitCount / 3, 1), label: `${Math.min(goalHitCount, 3)} / 3` };
      case 'goal_hit_7':
        return { progress: Math.min(goalHitCount / 7, 1), label: `${Math.min(goalHitCount, 7)} / 7` };
      case 'protein_champ':
        return { progress: Math.min(proteinHitCount / 5, 1), label: `${Math.min(proteinHitCount, 5)} / 5` };
      case 'under_budget_week':
        return { progress: Math.min(last7UnderCount / 7, 1), label: `${Math.min(last7UnderCount, 7)} / 7` };
      default:
        return null;
    }
  };

  // Merge definitions with unlock status
  const achievements: AchievementWithStatus[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const unlocked = unlockedAchievements.find(u => u.achievement_id === def.id);
    const prog = !unlocked ? computeProgress(def.id) : null;
    return {
      ...def,
      unlocked: !!unlocked,
      unlocked_at: unlocked?.unlocked_at,
      progress: prog?.progress,
      progressLabel: prog?.label,
    };
  });

  return {
    currentStreak,
    bestStreak,
    achievements,
    weightLogs,
    isLoading,
    newlyTriggeredMilestones,
    mealDates,
  };
}
