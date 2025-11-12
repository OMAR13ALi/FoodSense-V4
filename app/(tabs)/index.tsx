/**
 * Dashboard Screen - Apple Notes style free-writing interface
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/contexts/AppContext';
import { COLORS } from '@/constants/mockData';
import { CalorieProgressBar } from '@/components/CalorieProgressBar';
import { CircularSettingsButton } from '@/components/CircularSettingsButton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NutritionDetailsModal } from '@/components/NutritionDetailsModal';
import { AnimatedCalorieText } from '@/components/AnimatedCalorieText';
import { MealEntry, CalorieAnimationStatus } from '@/types';
import { analyzeNutrition } from '@/services/ai-service';

interface LineCalories {
  [lineIndex: number]: {
    text: string; // Track what text was calculated to detect changes
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealId: string;
    sources?: string[]; // Track sources for inline icon display
    status: CalorieAnimationStatus;
  };
}

export default function DashboardScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const router = useRouter();

  const { state, addMeal, updateMeal, isLoading, error, clearError } = useApp();
  const [text, setText] = useState('');
  const [lineCalories, setLineCalories] = useState<LineCalories>({});
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const debounceTimerRef = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});
  const textInputRef = useRef<TextInput>(null);

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

  // Parse text into lines
  const lines = text.split('\n');

  // Calculate current line based on cursor position
  const handleSelectionChange = (_event: any) => {
    // Currently not tracking active line, but handler kept for future use
  };

  // Auto-calculate calories for a line when user stops typing
  useEffect(() => {
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        return;
      }

      // Skip if text hasn't changed and already calculated
      if (lineCalories[index]?.status === 'done' &&
          lineCalories[index]?.text === trimmedLine) {
        return;
      }

      // Clear existing timer for this line
      if (debounceTimerRef.current[index]) {
        clearTimeout(debounceTimerRef.current[index]);
      }

      // Start debounce timer for this line
      debounceTimerRef.current[index] = setTimeout(async () => {
        // Start calculation - fade in "calculating..."
        setLineCalories(prev => ({
          ...prev,
          [index]: {
            text: trimmedLine,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            mealId: prev[index]?.mealId || '', // Preserve existing mealId if editing
            status: 'calculating'
          },
        }));

        // Track start time for minimum display duration
        const startTime = Date.now();

        try {
          // Show "sources" status after 350ms (ALWAYS HAPPENS - not cancelled)
          setTimeout(() => {
            console.log(`[index.tsx] Line ${index}: Status → 'sources' (empty array initially)`);
            setLineCalories(prev => ({
              ...prev,
              [index]: {
                ...prev[index],
                status: 'sources',
                sources: [], // Will be updated when result arrives
              },
            }));
          }, 350);

          // Call real AI API
          const result = await analyzeNutrition(trimmedLine);

          // Calculate elapsed time
          const elapsed = Date.now() - startTime;
          
          // Ensure sources phase shows for minimum 800ms total
          // (350ms to reach sources + 450ms for circle animations)
          const MIN_SOURCES_DISPLAY = 800;
          const remainingTime = Math.max(0, MIN_SOURCES_DISPLAY - elapsed);
          
          // Wait if needed to ensure circles are visible
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }

          // Update sources data while still in sources phase
          console.log(`[index.tsx] Line ${index}: Updating sources →`, result.sources);
          setLineCalories(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              sources: result.sources,
            },
          }));

          // Small delay to let circles fully appear with stagger
          await new Promise(resolve => setTimeout(resolve, 100));

          // Check if this line already has a meal (editing case)
          const existingMealId = lineCalories[index]?.mealId;
          let mealId: string;

          if (existingMealId) {
            // Update existing meal instead of creating duplicate
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
            // Add new meal to context with AI metadata
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

          console.log(`[index.tsx] Line ${index}: Status → 'done' (${result.calories} cal)`);
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
        } catch (error: any) {
          console.error('AI analysis error:', error);

          // Calculate elapsed time for error case too
          const elapsed = Date.now() - startTime;
          const MIN_SOURCES_DISPLAY = 800;
          const remainingTime = Math.max(0, MIN_SOURCES_DISPLAY - elapsed);
          
          // Wait to show sources phase even on error
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }

          // Check if this line already has a meal (editing case)
          const existingMealId = lineCalories[index]?.mealId;
          let mealId: string;

          if (existingMealId) {
            // Update existing meal with error
            updateMeal(existingMealId, {
              text: trimmedLine,
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              error: error.message || 'Failed to analyze nutrition',
            });
            mealId = existingMealId;
          } else {
            // Add new meal with error
            mealId = addMeal({
              text: trimmedLine,
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              error: error.message || 'Failed to analyze nutrition',
            });
          }

          // Show error state
          setLineCalories(prev => ({
            ...prev,
            [index]: {
              text: trimmedLine,
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              mealId,
              status: 'done',
            },
          }));
        }
      }, 1500); // Increased from 800ms to give users more time to type
    });

    return () => {
      Object.values(debounceTimerRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);



  const handleCalorieTap = (lineIndex: number) => {
    const lineData = lineCalories[lineIndex];
    if (!lineData || lineData.status !== 'done' || !lineData.mealId) return;

    // Use meal ID instead of text matching for reliable lookup
    const lineMeal = state.meals.find(m => m.id === lineData.mealId);
    if (lineMeal) {
      setSelectedMeal(lineMeal);
      setModalVisible(true);
    }
  };

  const handleMealUpdate = (updates: Partial<MealEntry>) => {
    if (selectedMeal) {
      updateMeal(selectedMeal.id, updates);

      // Update lineCalories if needed
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={[styles.todayText, { color: colors.text }]}>Today</Text>
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

        {/* Scrollable Content Area */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Text Editor */}
          <View style={styles.editorContainer}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textEditor,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              multiline
              placeholder=""
              placeholderTextColor={colors.placeholder}
              value={text}
              onChangeText={setText}
              onSelectionChange={handleSelectionChange}
              autoFocus
              textAlignVertical="top"
            />

            {/* Inline Calorie Overlays */}
            <View style={styles.calorieOverlay}>
              {lines.map((line, index) => {
                const lineData = lineCalories[index];
                if (!line.trim() || !lineData) return null;

                return (
                  <View
                    key={index}
                    style={[
                      styles.calorieLineContainer,
                      { top: index * 22 + 16 }, // 22 is line height, 16 is top padding
                    ]}
                    pointerEvents={lineData.status === 'done' ? 'auto' : 'none'}
                  >
                    <AnimatedCalorieText
                      status={lineData.status}
                      calories={lineData.calories}
                      sources={lineData.sources}
                      textSecondaryColor={colors.textSecondary}
                      caloriePositiveColor={colors.caloriePositive}
                      onPress={lineData.status === 'done' ? () => handleCalorieTap(index) : undefined}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Calorie Progress Bar - fixed at bottom */}
        <CalorieProgressBar
          consumed={state.totalCalories}
          goal={state.settings.dailyCalorieGoal}
          onPress={() => textInputRef.current?.focus()}
        />

        {/* Nutrition Details Modal */}
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
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  loadingIndicator: {
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 110,
  },
  editorContainer: {
    minHeight: 400,
    position: 'relative',
    paddingBottom: 16,
  },
  textEditor: {
    minHeight: 400,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.24,
  },
  calorieOverlay: {
    position: 'absolute',
    right: 20,
    top: 0,
    paddingVertical: 16,
  },
  calorieLineContainer: {
    position: 'absolute',
    right: 0,
    height: 22,
    justifyContent: 'center',
  },
  calorieText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
});
