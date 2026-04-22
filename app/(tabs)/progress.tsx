/**
 * Progress Screen - Gamified weight journey + nutrition trends
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AchievementGrid } from '@/components/AchievementGrid';
import { WeightProgressCard } from '@/components/WeightProgressCard';
import { WeightMilestoneTracker } from '@/components/WeightMilestoneTracker';
import { GoalSummaryCard } from '@/components/GoalSummaryCard';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { StreakCalendar } from '@/components/StreakCalendar';
import { getDailySummaries } from '@/services/database-service';
import { useStreakData } from '@/hooks/useStreakData';
import { useApp } from '@/contexts/AppContext';
import * as ProfileService from '@/services/profile-service';
import { UserProfile } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

export default function ProgressScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const { state } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [celebrationKey, setCelebrationKey] = useState<string | null>(null);
  const [shownMilestones, setShownMilestones] = useState<string[]>([]);

  const {
    currentStreak,
    bestStreak,
    achievements,
    weightLogs,
    isLoading: isLoadingGamification,
    newlyTriggeredMilestones,
    mealDates,
  } = useStreakData();

  // Staggered section entrance animations
  const sectionAnims = useRef(
    Array.from({ length: 5 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(16),
    }))
  ).current;

  useEffect(() => {
    if (!isLoadingGamification) {
      sectionAnims.forEach(({ opacity, translateY }, i) => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            delay: i * 80,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 350,
            delay: i * 80,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [isLoadingGamification]);

  // Queue celebration overlays one at a time
  useEffect(() => {
    const unseen = newlyTriggeredMilestones.filter(m => !shownMilestones.includes(m));
    if (unseen.length > 0 && !celebrationKey) {
      setCelebrationKey(unseen[0]);
    }
  }, [newlyTriggeredMilestones]);

  const handleDismissCelebration = () => {
    if (celebrationKey) {
      setShownMilestones(prev => [...prev, celebrationKey]);
    }
    setCelebrationKey(null);
  };

  // Load week chart data when weekOffset changes
  useEffect(() => {
    loadWeekData();
  }, [weekOffset]);

  // Refetch profile each time this tab regains focus
  useFocusEffect(
    useCallback(() => {
      ProfileService.getUserProfile()
        .then(setProfile)
        .catch(() => {});
    }, [])
  );

  const loadWeekData = async () => {
    setIsLoading(true);
    try {
      const offsetDays = weekOffset * 7;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + offsetDays);
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const data = await getDailySummaries(startDate, endDate);

      const filledData: DailySummary[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = formatDateKey(date);
        const existing = data.find(d => d.date === dateKey);
        filledData.push(
          existing || { date: dateKey, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 }
        );
      }

      setSummaries(filledData);
    } catch (error) {
      setSummaries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateLabel = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  };

  const weeklyStats = {
    totalCalories: summaries.reduce((s, d) => s + d.totalCalories, 0),
    totalProtein: summaries.reduce((s, d) => s + d.totalProtein, 0),
    totalCarbs: summaries.reduce((s, d) => s + d.totalCarbs, 0),
    totalFat: summaries.reduce((s, d) => s + d.totalFat, 0),
    totalMeals: summaries.reduce((s, d) => s + d.mealCount, 0),
    avgCalories: summaries.length > 0
      ? Math.round(summaries.reduce((s, d) => s + d.totalCalories, 0) / summaries.length)
      : 0,
  };

  const calorieChartData = summaries.map((day) => ({
    value: day.totalCalories,
    label: formatDateLabel(day.date),
    dataPointText: day.totalCalories > 0 ? Math.round(day.totalCalories).toString() : '',
    textColor: colors.text,
    textFontSize: 10,
  }));

  const macroChartData: any[] = summaries.map((day) => ({
    stacks: [
      { value: day.totalProtein, color: '#6366F1' },
      { value: day.totalCarbs, color: '#F59E0B' },
      { value: day.totalFat, color: '#10B981' },
    ],
    label: formatDateLabel(day.date),
    labelTextStyle: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  }));

  const getWeekRangeText = (): string => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    return `${Math.abs(weekOffset)} Weeks Ago`;
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const animStyle = (index: number) => ({
    opacity: sectionAnims[index].opacity,
    transform: [{ translateY: sectionAnims[index].translateY }],
  });

  // Weight journey data
  const hasWeightJourney =
    profile?.weight_kg && profile?.target_weight_kg && weightLogs.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your Journey</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Keep going — every day counts
          </Text>
        </View>

        {/* Section 0: Goal Summary */}
        {!isLoadingGamification && (
          <Animated.View style={animStyle(0)}>
            <GoalSummaryCard
              goalType={profile?.goal_type}
              startWeight={profile?.weight_kg}
              currentWeight={
                weightLogs.length > 0
                  ? weightLogs[weightLogs.length - 1].weight_kg
                  : profile?.weight_kg
              }
              targetWeight={profile?.target_weight_kg}
              dailyCalorieGoal={state.settings.dailyCalorieGoal}
              cardBackground={colors.cardBackground}
              textColor={colors.text}
              textSecondaryColor={colors.textSecondary}
            />
          </Animated.View>
        )}

        {/* Section 1: Streak Row */}
        {isLoadingGamification ? (
          <View style={[styles.skeletonCard, { backgroundColor: colors.cardBackground }]}>
            <ActivityIndicator size="small" color="#6366F1" />
          </View>
        ) : (
          <Animated.View style={[styles.streakRow, animStyle(1)]}>
            <LinearGradient
              colors={['#FF9500', '#FF3B30']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.streakCard}
            >
              <View style={styles.streakLeft}>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <View>
                  <Text style={styles.streakLabel}>Day Streak</Text>
                  <Text style={styles.streakSubLabel}>
                    {currentStreak === 0 ? 'Log a meal to start!' : '🔥 Keep it going!'}
                  </Text>
                </View>
              </View>
              <View style={styles.streakRight}>
                <View style={styles.streakStat}>
                  <Text style={styles.streakStatValue}>{bestStreak}</Text>
                  <Text style={styles.streakStatLabel}>Best</Text>
                </View>
              </View>
            </LinearGradient>

            {mealDates.length > 0 && (
              <StreakCalendar mealDates={mealDates} />
            )}
          </Animated.View>
        )}

        {/* Section 2: Weight Journey */}
        {!isLoadingGamification && hasWeightJourney && (
          <Animated.View style={animStyle(2)}>
            <WeightMilestoneTracker
              startWeight={profile!.weight_kg!}
              currentWeight={weightLogs[weightLogs.length - 1].weight_kg}
              targetWeight={profile!.target_weight_kg!}
              goalType={profile?.goal_type}
              celebratedMilestones={profile?.celebrated_milestones}
            />
            <WeightProgressCard
              logs={weightLogs}
              targetWeight={profile?.target_weight_kg}
              goalType={profile?.goal_type}
              cardBackground={colors.cardBackground}
              textColor={colors.text}
              textSecondaryColor={colors.textSecondary}
              successColor={colors.success}
              primaryColor={colors.primary}
              borderColor={colors.border}
            />
          </Animated.View>
        )}

        {/* Section 2 fallback: just the weight card when no journey target */}
        {!isLoadingGamification && !hasWeightJourney && weightLogs.length > 0 && (
          <Animated.View style={animStyle(2)}>
            <WeightProgressCard
              logs={weightLogs}
              targetWeight={profile?.target_weight_kg}
              goalType={profile?.goal_type}
              cardBackground={colors.cardBackground}
              textColor={colors.text}
              textSecondaryColor={colors.textSecondary}
              successColor={colors.success}
              primaryColor={colors.primary}
              borderColor={colors.border}
            />
          </Animated.View>
        )}

        {/* Section 3: Week Navigator + Charts */}
        <Animated.View style={animStyle(3)}>
          <View style={styles.weekNavigator}>
            <Pressable
              style={[styles.navButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => setWeekOffset(weekOffset - 1)}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.text} />
            </Pressable>
            <View style={styles.weekLabelContainer}>
              <Text style={[styles.weekLabel, { color: colors.text }]}>{getWeekRangeText()}</Text>
            </View>
            <Pressable
              style={[
                styles.navButton,
                { backgroundColor: colors.cardBackground },
                weekOffset >= 0 && styles.navButtonDisabled,
              ]}
              onPress={() => { if (weekOffset < 0) setWeekOffset(weekOffset + 1); }}
              disabled={weekOffset >= 0}
            >
              <IconSymbol
                name="chevron.right"
                size={20}
                color={weekOffset >= 0 ? colors.textSecondary : colors.text}
              />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading data...</Text>
            </View>
          ) : (
            <>
              {/* Summary stat cards */}
              <View style={styles.summaryCardsContainer}>
                {[
                  { icon: '⚡', value: weeklyStats.totalCalories.toLocaleString(), label: 'Total Calories' },
                  { icon: '🕐', value: weeklyStats.avgCalories.toLocaleString(), label: 'Avg / Day' },
                  { icon: '🍴', value: weeklyStats.totalMeals.toString(), label: 'Total Meals' },
                ].map((stat, i) => (
                  <View key={i} style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                    <Text style={styles.summaryCardIcon}>{stat.icon}</Text>
                    <Text style={[styles.summaryCardValue, { color: colors.text }]}>{stat.value}</Text>
                    <Text style={[styles.summaryCardLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* Calorie Trend Chart */}
              <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>Daily Calorie Trend</Text>
                {summaries.every(d => d.totalCalories === 0) ? (
                  <View style={styles.emptyState}>
                    <IconSymbol name="chart.line.uptrend.xyaxis" size={44} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: colors.text }]}>No data for this week</Text>
                    <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                      Start tracking meals to see your calorie trends
                    </Text>
                  </View>
                ) : (
                  <LineChart
                    data={calorieChartData}
                    width={SCREEN_WIDTH - 80}
                    height={220}
                    spacing={42}
                    initialSpacing={20}
                    endSpacing={20}
                    color="#2563EB"
                    thickness={3}
                    startFillColor="rgba(37,99,235,0.25)"
                    endFillColor="rgba(37,99,235,0.04)"
                    startOpacity={0.9}
                    endOpacity={0.1}
                    areaChart
                    curved
                    hideDataPoints={false}
                    dataPointsHeight={10}
                    dataPointsWidth={10}
                    dataPointsColor="#2563EB"
                    dataPointsRadius={5}
                    textColor1={colors.textSecondary}
                    textShiftY={-8}
                    textFontSize={10}
                    yAxisColor={colors.border}
                    xAxisColor={colors.border}
                    yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500' }}
                    hideRules={false}
                    rulesColor={colors.border}
                    rulesType="solid"
                    yAxisThickness={1}
                    xAxisThickness={1}
                    noOfSections={4}
                    maxValue={Math.max(...calorieChartData.map(d => d.value), 2500)}
                    animateOnDataChange
                    animationDuration={800}
                    onDataChangeAnimationDuration={400}
                  />
                )}
              </View>

              {/* Macro Breakdown Chart */}
              <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>Macro Breakdown</Text>
                <View style={styles.legend}>
                  {[
                    { color: '#6366F1', label: `Protein (${Math.round(weeklyStats.totalProtein)}g)` },
                    { color: '#F59E0B', label: `Carbs (${Math.round(weeklyStats.totalCarbs)}g)` },
                    { color: '#10B981', label: `Fat (${Math.round(weeklyStats.totalFat)}g)` },
                  ].map(({ color, label }) => (
                    <View key={label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: color }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>{label}</Text>
                    </View>
                  ))}
                </View>
                {summaries.every(d => d.totalProtein === 0 && d.totalCarbs === 0 && d.totalFat === 0) ? (
                  <View style={styles.emptyState}>
                    <IconSymbol name="chart.bar.fill" size={44} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: colors.text }]}>No macro data for this week</Text>
                    <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                      Track meals to see your protein, carbs, and fat breakdown
                    </Text>
                  </View>
                ) : (
                  <BarChart
                    stackData={macroChartData}
                    width={SCREEN_WIDTH - 80}
                    height={220}
                    barWidth={36}
                    spacing={22}
                    roundedTop
                    roundedBottom
                    hideRules
                    xAxisThickness={1}
                    yAxisThickness={1}
                    xAxisColor={colors.border}
                    yAxisColor={colors.border}
                    yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                    noOfSections={4}
                    maxValue={Math.max(...summaries.map(d => d.totalProtein + d.totalCarbs + d.totalFat), 200)}
                    initialSpacing={20}
                    endSpacing={20}
                  />
                )}
              </View>
            </>
          )}
        </Animated.View>

        {/* Section 4: Achievements */}
        <Animated.View style={[styles.section, animStyle(4)]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACHIEVEMENTS</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {unlockedCount} of {achievements.length} unlocked
          </Text>
          {isLoadingGamification ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />
          ) : (
            <AchievementGrid
              achievements={achievements}
              cardBackground={colors.cardBackground}
              textColor={colors.text}
              textSecondaryColor={colors.textSecondary}
              primaryColor={colors.primary}
            />
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Celebration overlay */}
      <CelebrationOverlay
        visible={!!celebrationKey}
        milestoneKey={celebrationKey ?? ''}
        onDismiss={handleDismissCelebration}
        goalType={profile?.goal_type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  skeletonCard: {
    height: 100,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakRow: {
    gap: 12,
    marginBottom: 20,
  },
  streakCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 90,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  streakNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  streakRight: {
    alignItems: 'flex-end',
  },
  streakStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  streakStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  weekLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryCardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 16,
  },
});
