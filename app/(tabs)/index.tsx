/**
 * Dashboard Screen — Apple Notes style free-writing interface.
 * Calorie pills are rendered in a flex column aligned to each text line,
 * never absolutely positioned by hardcoded line-index math.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/contexts/AppContext';
import { useHaptics } from '@/hooks/useHaptics';
import { COLORS } from '@/constants/mockData';
import { designColors, fonts, space } from '@/constants/design';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/layout';
import { CalorieProgressBar, CALORIE_BAR_COLLAPSED_HEIGHT } from '@/components/CalorieProgressBar';
import { CircularSettingsButton } from '@/components/CircularSettingsButton';
import { NutritionDetailsModal } from '@/components/NutritionDetailsModal';
import { AnimatedCalorieText } from '@/components/AnimatedCalorieText';
import { FavoritesPanel } from '@/components/FavoritesPanel';
import { RecommendationCard } from '@/components/RecommendationCard';
import { StreakBadge } from '@/components/StreakBadge';
import { MealEntry, CalorieAnimationStatus, FavoriteMeal } from '@/types';
import { analyzeNutrition } from '@/services/ai-service';
import { checkAndUnlockAchievements, calculateAndSaveStreak, getAllMealDates } from '@/services/gamification-service';
import { getAnimationConfig } from '@/utils/animationConfigs';
import { useStreakData } from '@/hooks/useStreakData';

const LINE_HEIGHT = 26;
const EDITOR_PADDING_VERTICAL = 16;
const PILL_COLUMN_WIDTH = 110;

interface LineCalories {
  [lineIndex: number]: {
    text: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealId: string;
    sources?: string[];
    status: CalorieAnimationStatus;
  };
}

export default function DashboardScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const c = designColors[colorScheme];
  const insets = useSafeAreaInsets();

  const { state, addMeal, updateMeal, addMealFromFavorite, isLoading, error, clearError } = useApp();
  const haptics = useHaptics();
  const animConfig = getAnimationConfig(state.animationSettings.intensity);
  const { currentStreak } = useStreakData();

  const [text, setText] = useState('');
  const [lineCalories, setLineCalories] = useState<LineCalories>({});
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const debounceTimerRef = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});
  const textInputRef = useRef<TextInput>(null);
  const prevStreakRef = useRef<number>(currentStreak);
  const goalHitFiredRef = useRef<boolean>(false);

  // Fire a streak toast when the streak actually increments, and a goal-hit
  // toast the first time today's calories cross 90% of goal.
  useEffect(() => {
    const goal = state.settings.dailyCalorieGoal;
    const consumed = state.totalCalories;
    if (goal > 0 && consumed > 0) {
      const ratio = consumed / goal;
      const inWindow = ratio >= 0.9 && ratio <= 1.1;
      if (inWindow && !goalHitFiredRef.current) {
        goalHitFiredRef.current = true;
        haptics.trigger('notification');
        Toast.show({
          type: 'success',
          text1: '🎯 Goal hit!',
          text2: `${Math.round(consumed)} / ${goal} cal`,
          position: 'top',
          visibilityTime: 2500,
        });
        getAllMealDates()
          .then((dates) =>
            checkAndUnlockAchievements({
              mealDates: dates,
              currentStreak,
              calorieGoal: goal,
              proteinGoal: state.settings.targetProtein,
            })
          )
          .catch(() => {});
      } else if (!inWindow && ratio > 1.1) {
        // Reset if overshot so future adjustments can re-fire
        goalHitFiredRef.current = true;
      }
    }
  }, [state.totalCalories, state.settings.dailyCalorieGoal]);

  // Refresh streak after a meal is added; toast if it incremented.
  useEffect(() => {
    if (state.meals.length === 0) return;
    calculateAndSaveStreak()
      .then(({ currentStreak: next }) => {
        if (next > prevStreakRef.current && next > 0) {
          haptics.trigger('notification');
          Toast.show({
            type: 'success',
            text1: `🔥 Streak: ${next} day${next === 1 ? '' : 's'}`,
            text2: next === 1 ? 'You just started a streak!' : 'Keep the momentum going!',
            position: 'top',
            visibilityTime: 2500,
          });
        }
        prevStreakRef.current = next;
      })
      .catch(() => {});
  }, [state.meals.length]);

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

  const lines = useMemo(() => text.split('\n'), [text]);

  useEffect(() => {
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      if (lineCalories[index]?.status === 'done' && lineCalories[index]?.text === trimmedLine) {
        return;
      }
      if (debounceTimerRef.current[index]) {
        clearTimeout(debounceTimerRef.current[index]);
      }

      debounceTimerRef.current[index] = setTimeout(async () => {
        setLineCalories(prev => ({
          ...prev,
          [index]: {
            text: trimmedLine,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            mealId: prev[index]?.mealId || '',
            status: 'calculating',
          },
        }));

        if (animConfig.phase1.haptic) haptics.trigger(animConfig.phase1.haptic);
        const startTime = Date.now();

        try {
          setTimeout(() => {
            setLineCalories(prev => ({
              ...prev,
              [index]: { ...prev[index], status: 'sources', sources: [] },
            }));
            if (animConfig.phase2.haptic) haptics.trigger(animConfig.phase2.haptic);
          }, 350);

          const result = await analyzeNutrition(trimmedLine);
          const elapsed = Date.now() - startTime;
          const MIN_SOURCES_DISPLAY = 800;
          const remainingTime = Math.max(0, MIN_SOURCES_DISPLAY - elapsed);
          if (remainingTime > 0) await new Promise(r => setTimeout(r, remainingTime));

          setLineCalories(prev => ({
            ...prev,
            [index]: { ...prev[index], sources: result.sources },
          }));
          await new Promise(r => setTimeout(r, 100));

          const existingMealId = lineCalories[index]?.mealId;
          let mealId: string;

          if (existingMealId) {
            updateMeal(existingMealId, {
              text: trimmedLine,
              calories: result.calories,
              protein: result.protein,
              carbs: result.carbs,
              fat: result.fat,
              aiExplanation: result.explanation,
              confidence: result.confidence,
              sources: result.sources,
            });
            mealId = existingMealId;
          } else {
            mealId = addMeal({
              text: trimmedLine,
              calories: result.calories,
              protein: result.protein,
              carbs: result.carbs,
              fat: result.fat,
              aiExplanation: result.explanation,
              confidence: result.confidence,
              sources: result.sources,
            });
          }

          setLineCalories(prev => ({
            ...prev,
            [index]: {
              text: trimmedLine,
              calories: result.calories,
              protein: result.protein,
              carbs: result.carbs,
              fat: result.fat,
              mealId,
              sources: result.sources,
              status: 'done',
            },
          }));
          if (animConfig.phase3.haptic) haptics.trigger(animConfig.phase3.haptic);
        } catch (err: any) {
          console.error('AI analysis error:', err);
          const elapsed = Date.now() - startTime;
          const MIN_SOURCES_DISPLAY = 800;
          const remainingTime = Math.max(0, MIN_SOURCES_DISPLAY - elapsed);
          if (remainingTime > 0) await new Promise(r => setTimeout(r, remainingTime));

          const existingMealId = lineCalories[index]?.mealId;
          let mealId: string;
          if (existingMealId) {
            updateMeal(existingMealId, {
              text: trimmedLine,
              calories: 0, protein: 0, carbs: 0, fat: 0,
              error: err.message || 'Failed to analyze nutrition',
            });
            mealId = existingMealId;
          } else {
            mealId = addMeal({
              text: trimmedLine,
              calories: 0, protein: 0, carbs: 0, fat: 0,
              error: err.message || 'Failed to analyze nutrition',
            });
          }
          setLineCalories(prev => ({
            ...prev,
            [index]: {
              text: trimmedLine,
              calories: 0, protein: 0, carbs: 0, fat: 0,
              mealId, status: 'done',
            },
          }));
        }
      }, 1500);
    });

    return () => {
      Object.values(debounceTimerRef.current).forEach(t => t && clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleCalorieTap = (lineIndex: number) => {
    const lineData = lineCalories[lineIndex];
    if (!lineData || lineData.status !== 'done' || !lineData.mealId) return;
    const lineMeal = state.meals.find(m => m.id === lineData.mealId);
    if (lineMeal) {
      setSelectedMeal(lineMeal);
      setModalVisible(true);
    }
  };

  const handleMealUpdate = (updates: Partial<MealEntry>) => {
    if (selectedMeal) {
      updateMeal(selectedMeal.id, updates);
      const lineIndex = lines.findIndex(line => line.trim() === selectedMeal.text);
      if (lineIndex !== -1 && updates.calories !== undefined) {
        setLineCalories(prev => ({
          ...prev,
          [lineIndex]: {
            ...prev[lineIndex],
            calories: updates.calories!,
            protein: updates.protein || prev[lineIndex].protein,
            carbs: updates.carbs || prev[lineIndex].carbs,
            fat: updates.fat || prev[lineIndex].fat,
          },
        }));
      }
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedMeal(null);
  };

  const handleFavoriteTap = async (favorite: FavoriteMeal) => {
    try {
      await addMealFromFavorite(favorite.id);
      const newText = text ? `${text}\n${favorite.name}` : favorite.name;
      setText(newText);
      Toast.show({
        type: 'success',
        text1: 'Added from favorites',
        text2: `${favorite.name} (${Math.round(favorite.calories)} cal)`,
        position: 'top',
        visibilityTime: 2000,
      });
      textInputRef.current?.focus();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to add favorite meal',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const handleSeeMeals = () => {
    // Future: navigate to summary tab. For now, no-op (the bar still expands).
  };

  const barBottomOffset = TAB_BAR_TOTAL_HEIGHT;
  const editorBottomPadding = barBottomOffset + CALORIE_BAR_COLLAPSED_HEIGHT + space[3];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View>
              <View style={styles.todayRow}>
                <Text style={[styles.todayText, { color: c.text.primary }]}>Today</Text>
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color={c.text.tertiary}
                    style={styles.loadingIndicator}
                  />
                )}
              </View>
              <Text style={[styles.dateText, { color: c.text.secondary }]}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </View>
          <View style={styles.topBarRight}>
            <StreakBadge
              streak={currentStreak}
              textColor={colors.textSecondary}
              borderColor={colors.border}
            />
            <CircularSettingsButton />
          </View>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: editorBottomPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FavoritesPanel
            favorites={state.favorites}
            onFavoriteTap={handleFavoriteTap}
            isLoading={isLoading}
            textColor={colors.text}
            textSecondaryColor={colors.textSecondary}
            backgroundColor={colors.background}
            surfaceColor={colors.cardBackground}
            primaryColor={colors.primary}
          />

          <RecommendationCard
            textColor={colors.text}
            textSecondaryColor={colors.textSecondary}
            surfaceColor={colors.cardBackground}
            primaryColor={colors.primary}
            accentStart={colors.accentStart}
            accentEnd={colors.accentEnd}
          />

          {/* Editor with side-by-side calorie pill column */}
          <View style={styles.editorContainer}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textEditor,
                {
                  color: c.text.primary,
                  paddingRight: PILL_COLUMN_WIDTH,
                },
              ]}
              multiline
              placeholder="What did you eat?"
              placeholderTextColor={c.text.tertiary}
              value={text}
              onChangeText={setText}
              autoFocus
              textAlignVertical="top"
              scrollEnabled={false}
            />

            {/* Pill column — flex stack of rows, each row matches LINE_HEIGHT */}
            <View
              style={[styles.pillColumn, { width: PILL_COLUMN_WIDTH }]}
              pointerEvents="box-none"
            >
              {lines.map((line, index) => {
                const lineData = lineCalories[index];
                const showPill = !!line.trim() && !!lineData;
                return (
                  <View
                    key={index}
                    style={[styles.pillRow, { height: LINE_HEIGHT }]}
                    pointerEvents={showPill && lineData?.status === 'done' ? 'auto' : 'none'}
                  >
                    {showPill && (
                      <View style={styles.pillInner}>
                        <AnimatedCalorieText
                          status={lineData!.status}
                          calories={lineData!.calories}
                          sources={lineData!.sources}
                          textSecondaryColor={c.text.secondary}
                          caloriePositiveColor={c.accent}
                          onPress={lineData!.status === 'done' ? () => handleCalorieTap(index) : undefined}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Floating bottom calorie bar — hidden while keyboard is up so the
            user can see what they're typing. */}
        {!keyboardVisible && (
        <View
          style={[styles.barWrap, { paddingBottom: barBottomOffset }]}
          pointerEvents="box-none"
        >
          <CalorieProgressBar
            consumed={state.totalCalories}
            goal={state.settings.dailyCalorieGoal}
            protein={state.totalProtein}
            targetProtein={state.settings.targetProtein}
            carbs={state.totalCarbs}
            targetCarbs={state.settings.targetCarbs}
            fat={state.totalFat}
            targetFat={state.settings.targetFat}
            onSeeMeals={handleSeeMeals}
          />
        </View>
        )}

        <NutritionDetailsModal
          visible={modalVisible}
          meal={selectedMeal}
          onClose={handleModalClose}
          onUpdate={handleMealUpdate}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space[5],
    paddingVertical: space[4],
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginTop: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayText: {
    fontFamily: fonts.serif,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  loadingIndicator: { marginLeft: 2 },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  editorContainer: {
    minHeight: 400,
    position: 'relative',
    paddingBottom: space[4],
  },
  textEditor: {
    minHeight: 400,
    paddingHorizontal: space[5],
    paddingVertical: EDITOR_PADDING_VERTICAL,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: LINE_HEIGHT,
    letterSpacing: -0.24,
  },
  pillColumn: {
    position: 'absolute',
    right: space[5],
    top: EDITOR_PADDING_VERTICAL,
    bottom: 0,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  pillRow: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
