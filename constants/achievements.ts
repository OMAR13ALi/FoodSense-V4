import { AchievementDefinition } from '@/types';

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_meal',
    title: 'First Bite',
    description: 'Log your very first meal',
    emoji: '🍽️',
    category: 'consistency',
  },
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Log meals 3 days in a row',
    emoji: '🔥',
    category: 'streak',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Log meals 7 days in a row',
    emoji: '⚡',
    category: 'streak',
  },
  {
    id: 'streak_14',
    title: 'Two Weeks Strong',
    description: '14-day logging streak',
    emoji: '💪',
    category: 'streak',
  },
  {
    id: 'streak_30',
    title: 'Month Master',
    description: '30-day logging streak',
    emoji: '🏆',
    category: 'streak',
  },
  {
    id: 'goal_hit_3',
    title: 'On Target',
    description: 'Hit your calorie goal 3 days',
    emoji: '🎯',
    category: 'goal',
  },
  {
    id: 'goal_hit_7',
    title: 'Consistent',
    description: 'Hit your calorie goal 7 days',
    emoji: '✅',
    category: 'goal',
  },
  {
    id: 'protein_champ',
    title: 'Protein Champion',
    description: 'Hit your protein goal 5 days',
    emoji: '🥩',
    category: 'nutrition',
  },
  {
    id: 'under_budget_week',
    title: 'Budget Master',
    description: 'Stay under calorie goal all week',
    emoji: '💎',
    category: 'goal',
  },
];
