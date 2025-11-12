/**
 * History Screen - View past meals by date
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';
import { loadMeals } from '@/services/storage-service';
import { COLORS } from '@/constants/mockData';
import { MealEntry } from '@/types';
import { MealEntryCard } from '@/components/MealEntryCard';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HistoryScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load meals when selected date changes
  useEffect(() => {
    loadMealsForDate(selectedDate);
  }, [selectedDate]);

  const loadMealsForDate = async (date: Date) => {
    setIsLoading(true);
    try {
      const loadedMeals = await loadMeals(date);
      setMeals(loadedMeals);
    } catch (error) {
      console.error('Error loading historical meals:', error);
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for the selected date
  const calculateTotals = () => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const totals = calculateTotals();

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Navigate to next day (but not future)
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  // Check if can go to next day
  const canGoNext = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return nextDay <= today;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>History</Text>

        {/* Date Selector */}
        <View style={[styles.dateSelector, { backgroundColor: colors.cardBackground }]}>
          <Pressable
            onPress={goToPreviousDay}
            style={[styles.navButton, { backgroundColor: colors.secondary }]}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDate(selectedDate)}
            </Text>
            <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={goToNextDay}
            disabled={!canGoNext()}
            style={[
              styles.navButton,
              { backgroundColor: colors.secondary },
              !canGoNext() && styles.navButtonDisabled,
            ]}
          >
            <IconSymbol
              name="chevron.right"
              size={20}
              color={canGoNext() ? colors.text : colors.border}
            />
          </Pressable>
        </View>

        {/* Date Picker Modal (iOS/Android) */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) {
                setSelectedDate(date);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Daily Summary Card */}
        {meals.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
              DAILY TOTALS
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {Math.round(totals.calories)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Calories</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {Math.round(totals.protein)}g
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Protein</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {Math.round(totals.carbs)}g
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Carbs</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {Math.round(totals.fat)}g
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Fat</Text>
              </View>
            </View>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Loading meals...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && meals.length === 0 && (
          <View style={styles.centerContainer}>
            <IconSymbol name="tray" size={64} color={colors.border} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No meals logged on this day
            </Text>
          </View>
        )}

        {/* Meals List */}
        {!isLoading && meals.length > 0 && (
          <View style={styles.mealsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              MEALS ({meals.length})
            </Text>
            {meals.map((meal) => (
              <MealEntryCard key={meal.id} meal={meal} />
            ))}
          </View>
        )}
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
  header: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  mealsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
});
