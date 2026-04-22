/**
 * Summary Screen - Daily summary with circular progress and macro breakdown
 */

import React, { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/contexts/AppContext';
import { COLORS, MACRO_EMOJIS } from '@/constants/mockData';
import { fonts } from '@/constants/design';
import { CircularProgress } from '@/components/CircularProgress';
import { CircularSettingsButton } from '@/components/CircularSettingsButton';
import { MealEntryCard } from '@/components/MealEntryCard';

export default function SummaryScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];

  const { state, isLoading, error, clearError, deleteMeal } = useApp();

  // Show toast notification when error occurs
  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
        position: 'top',
        visibilityTime: 3000,
        onHide: clearError,
      });
    }
  }, [error, clearError]);

  // Handle meal deletion with confirmation
  const handleDeleteMeal = (mealId: string, mealText: string) => {
    Alert.alert(
      'Delete Meal',
      `Remove "${mealText}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMeal(mealId);
            Toast.show({
              type: 'success',
              text1: 'Meal deleted',
              position: 'bottom',
              visibilityTime: 2000,
            });
          },
        },
      ]
    );
  };

  // Calculate macro percentages
  const proteinPercentage = state.settings.targetProtein > 0
    ? (state.totalProtein / state.settings.targetProtein) * 100
    : 0;
  const carbsPercentage = state.settings.targetCarbs > 0
    ? (state.totalCarbs / state.settings.targetCarbs) * 100
    : 0;
  const fatPercentage = state.settings.targetFat > 0
    ? (state.totalFat / state.settings.targetFat) * 100
    : 0;

  const macroData = [
    {
      emoji: MACRO_EMOJIS.protein,
      label: 'Protein',
      value: state.totalProtein,
      target: state.settings.targetProtein,
      unit: 'g',
      percentage: proteinPercentage,
      color: '#6366F1',
    },
    {
      emoji: MACRO_EMOJIS.carbs,
      label: 'Carbs',
      value: state.totalCarbs,
      target: state.settings.targetCarbs,
      unit: 'g',
      percentage: carbsPercentage,
      color: '#F59E0B',
    },
    {
      emoji: MACRO_EMOJIS.fat,
      label: 'Fat',
      value: state.totalFat,
      target: state.settings.targetFat,
      unit: 'g',
      percentage: fatPercentage,
      color: '#10B981',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Settings Button */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.header, { color: colors.text }]}>Daily Summary</Text>
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={colors.textSecondary}
                style={styles.loadingIndicator}
              />
            )}
          </View>
          <CircularSettingsButton />
        </View>

        {/* Date */}
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Quick Stats Dashboard */}
        <View style={styles.quickStatsContainer}>
          {/* Calories Card - Main Focus */}
          <LinearGradient
            colors={['#2563EB', '#60A5FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainStatCard}
          >
            <View style={styles.mainStatHeader}>
              <Text style={styles.mainStatLabel}>Calories Today</Text>
              <Text style={styles.mainStatEmoji}>🔥</Text>
            </View>
            <Text style={styles.mainStatValue}>
              {state.totalCalories.toLocaleString()}
            </Text>
            <Text style={styles.mainStatSubtext}>
              of {state.settings.dailyCalorieGoal.toLocaleString()} goal
            </Text>
            <View style={styles.mainStatProgressBar}>
              <View
                style={[
                  styles.mainStatProgressFill,
                  {
                    width: `${Math.min((state.totalCalories / state.settings.dailyCalorieGoal) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </LinearGradient>

          {/* Quick Stats Grid */}
          <View style={styles.quickStatsGrid}>
            {/* Protein */}
            <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={styles.quickStatEmoji}>💪</Text>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {Math.round(state.totalProtein)}g
              </Text>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                Protein
              </Text>
              <View style={[styles.quickStatBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.quickStatBarFill,
                    { backgroundColor: '#6366F1', width: `${Math.min((state.totalProtein / state.settings.targetProtein) * 100, 100)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Carbs */}
            <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={styles.quickStatEmoji}>🍞</Text>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {Math.round(state.totalCarbs)}g
              </Text>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                Carbs
              </Text>
              <View style={[styles.quickStatBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.quickStatBarFill,
                    { backgroundColor: '#F59E0B', width: `${Math.min((state.totalCarbs / state.settings.targetCarbs) * 100, 100)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Fat */}
            <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={styles.quickStatEmoji}>🥑</Text>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {Math.round(state.totalFat)}g
              </Text>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                Fat
              </Text>
              <View style={[styles.quickStatBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.quickStatBarFill,
                    { backgroundColor: '#10B981', width: `${Math.min((state.totalFat / state.settings.targetFat) * 100, 100)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Meals Count */}
            <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={styles.quickStatEmoji}>🍽️</Text>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {state.meals.length}
              </Text>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                Meals
              </Text>
            </View>
          </View>
        </View>

        {/* Macro Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            MACRO BREAKDOWN
          </Text>

          {macroData.map((macro, index) => (
            <View
              key={index}
              style={[
                styles.macroCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
              ]}
            >
              <View style={styles.macroHeader}>
                <View style={styles.macroLabelContainer}>
                  <Text style={styles.macroEmoji}>{macro.emoji}</Text>
                  <Text style={[styles.macroLabel, { color: colors.text }]}>{macro.label}</Text>
                </View>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {Math.round(macro.value)} / {macro.target} {macro.unit}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.macroProgressBackground, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.macroProgressFill,
                    {
                      backgroundColor: macro.color,
                      width: `${Math.min(macro.percentage, 100)}%`,
                    },
                  ]}
                />
              </View>

              <Text style={[styles.macroPercentage, { color: colors.textSecondary }]}>
                {macro.percentage.toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Meal History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            TODAY&apos;S MEALS ({state.meals.length})
          </Text>

          {state.meals.length > 0 ? (
            state.meals.map((meal) => (
              <MealEntryCard
                key={meal.id}
                meal={meal}
                onDelete={() => handleDeleteMeal(meal.id, meal.text)}
              />
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No meals logged yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    fontFamily: fonts.serif,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  loadingIndicator: {
    marginLeft: 4,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 32,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  remainingCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  remainingLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  remainingValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  macroCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroEmoji: {
    fontSize: 20,
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  macroProgressBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroPercentage: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Quick Stats Widget Styles
  quickStatsContainer: {
    marginBottom: 32,
  },
  mainStatCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  mainStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainStatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  mainStatEmoji: {
    fontSize: 28,
  },
  mainStatValue: {
    fontFamily: fonts.serif,
    fontSize: 52,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 4,
  },
  mainStatSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 16,
  },
  mainStatProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  mainStatProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickStatEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickStatValue: {
    fontFamily: fonts.serif,
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickStatBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  quickStatBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
