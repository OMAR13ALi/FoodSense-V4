/**
 * Progress Screen - Weekly nutrition trends with beautiful charts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getRecentDailySummaries, getDailySummaries } from '@/services/database-service';

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

  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [summaries, setSummaries] = useState<DailySummary[]>([]);

  // Load data when week changes
  useEffect(() => {
    loadWeekData();
  }, [weekOffset]);

  const loadWeekData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range for the selected week
      const daysToLoad = 7;
      const offsetDays = weekOffset * 7;

      // Calculate the actual date range we need
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + offsetDays);
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - (daysToLoad - 1));
      startDate.setHours(0, 0, 0, 0);

      // Use getDailySummaries with the specific date range
      const data = await getDailySummaries(startDate, endDate);

      // Fill in missing days with zero values
      const filledData: DailySummary[] = [];

      for (let i = 0; i < daysToLoad; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = formatDateKey(date);

        const existing = data.find(d => d.date === dateKey);
        filledData.push(existing || {
          date: dateKey,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          mealCount: 0,
        });
      }

      setSummaries(filledData);
    } catch (error) {
      console.error('Failed to load week data:', error);
      setSummaries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Calculate weekly stats
  const weeklyStats = {
    totalCalories: summaries.reduce((sum, d) => sum + d.totalCalories, 0),
    totalProtein: summaries.reduce((sum, d) => sum + d.totalProtein, 0),
    totalCarbs: summaries.reduce((sum, d) => sum + d.totalCarbs, 0),
    totalFat: summaries.reduce((sum, d) => sum + d.totalFat, 0),
    totalMeals: summaries.reduce((sum, d) => sum + d.mealCount, 0),
    avgCalories: summaries.length > 0 ? Math.round(summaries.reduce((sum, d) => sum + d.totalCalories, 0) / summaries.length) : 0,
  };

  // Prepare calorie chart data
  const calorieChartData = summaries.map((day, index) => ({
    value: day.totalCalories,
    label: formatDateLabel(day.date),
    dataPointText: day.totalCalories > 0 ? Math.round(day.totalCalories).toString() : '',
    textColor: colors.text,
    textFontSize: 10,
  }));

  // Prepare macro chart data - side by side bars
  const macroChartData: any[] = [];
  summaries.forEach((day, index) => {
    const label = formatDateLabel(day.date);

    // Protein bar
    macroChartData.push({
      value: day.totalProtein,
      label: index === 0 ? label : '',
      frontColor: '#6C9BD1', // Blue for protein
      spacing: 2,
      labelWidth: 30,
      labelTextStyle: { color: colors.textSecondary, fontSize: 10 },
    });

    // Carbs bar
    macroChartData.push({
      value: day.totalCarbs,
      frontColor: '#FFA07A', // Orange for carbs
      spacing: 2,
    });

    // Fat bar
    macroChartData.push({
      value: day.totalFat,
      frontColor: '#98D8AA', // Green for fat
      spacing: index < summaries.length - 1 ? 24 : 2,
    });
  });

  const handlePreviousWeek = () => {
    setWeekOffset(weekOffset - 1);
  };

  const handleNextWeek = () => {
    if (weekOffset < 0) {
      setWeekOffset(weekOffset + 1);
    }
  };

  const getWeekRangeText = (): string => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    return `${Math.abs(weekOffset)} Weeks Ago`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your nutrition journey
          </Text>
        </View>

        {/* Week Navigator */}
        <View style={styles.weekNavigator}>
          <Pressable
            style={[styles.navButton, { backgroundColor: colors.surface }]}
            onPress={handlePreviousWeek}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.weekLabelContainer}>
            <Text style={[styles.weekLabel, { color: colors.text }]}>
              {getWeekRangeText()}
            </Text>
          </View>

          <Pressable
            style={[
              styles.navButton,
              { backgroundColor: colors.surface },
              weekOffset >= 0 && styles.navButtonDisabled,
            ]}
            onPress={handleNextWeek}
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
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading data...
            </Text>
          </View>
        ) : (
          <>
            {/* Weekly Summary Cards */}
            <View style={styles.summaryCardsContainer}>
              <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.summaryCardValue, { color: colors.text }]}>
                  {weeklyStats.totalCalories.toLocaleString()}
                </Text>
                <Text style={[styles.summaryCardLabel, { color: colors.textSecondary }]}>
                  Total Calories
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.summaryCardValue, { color: colors.text }]}>
                  {weeklyStats.avgCalories.toLocaleString()}
                </Text>
                <Text style={[styles.summaryCardLabel, { color: colors.textSecondary }]}>
                  Avg / Day
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.summaryCardValue, { color: colors.text }]}>
                  {weeklyStats.totalMeals}
                </Text>
                <Text style={[styles.summaryCardLabel, { color: colors.textSecondary }]}>
                  Total Meals
                </Text>
              </View>
            </View>

            {/* Calorie Trend Chart */}
            <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                Daily Calorie Trend
              </Text>

              {summaries.every(d => d.totalCalories === 0) ? (
                <View style={styles.emptyState}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={44} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.text }]}>
                    No data for this week
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                    Start tracking meals to see your calorie trends
                  </Text>
                </View>
              ) : (
                <LineChart
                  data={calorieChartData}
                  width={SCREEN_WIDTH - 72}
                  height={200}
                  spacing={40}
                  initialSpacing={20}
                  endSpacing={20}
                  color="#6C9BD1"
                  thickness={3}
                  startFillColor="rgba(108, 155, 209, 0.3)"
                  endFillColor="rgba(108, 155, 209, 0.05)"
                  startOpacity={0.9}
                  endOpacity={0.2}
                  areaChart
                  curved
                  hideDataPoints={false}
                  dataPointsHeight={8}
                  dataPointsWidth={8}
                  dataPointsColor="#6C9BD1"
                  dataPointsRadius={4}
                  textColor1={colors.textSecondary}
                  textShiftY={-8}
                  textShiftX={0}
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
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                Macro Breakdown
              </Text>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#6C9BD1' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    Protein ({Math.round(weeklyStats.totalProtein)}g)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FFA07A' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    Carbs ({Math.round(weeklyStats.totalCarbs)}g)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#98D8AA' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    Fat ({Math.round(weeklyStats.totalFat)}g)
                  </Text>
                </View>
              </View>

              {summaries.every(d => d.totalProtein === 0 && d.totalCarbs === 0 && d.totalFat === 0) ? (
                <View style={styles.emptyState}>
                  <IconSymbol name="chart.bar.fill" size={44} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.text }]}>
                    No macro data for this week
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                    Track meals to see your protein, carbs, and fat breakdown
                  </Text>
                </View>
              ) : (
                <BarChart
                  data={macroChartData}
                  width={SCREEN_WIDTH - 72}
                  height={200}
                  barWidth={12}
                  spacing={2}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisThickness={1}
                  yAxisThickness={1}
                  xAxisColor={colors.border}
                  yAxisColor={colors.border}
                  yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                  noOfSections={4}
                  maxValue={Math.max(...macroChartData.map(d => d.value), 200)}
                  initialSpacing={12}
                  endSpacing={12}
                />
              )}
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
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
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 3,
  },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 14,
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
});
