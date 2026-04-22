import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  calculateTDEE,
  DEFAULT_PACE_KG_PER_WEEK,
  PACE_OPTIONS_KG_PER_WEEK,
} from '@/services/gamification-service';

export default function GoalsScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const router = useRouter();
  const { draft, updateDraft } = useOnboarding();

  const goalType = draft.goal_type ?? 'maintenance';
  const pace = draft.pace_kg_per_week ?? DEFAULT_PACE_KG_PER_WEEK;
  const showPace = goalType === 'weight_loss' || goalType === 'weight_gain';

  const suggested = useMemo(() => {
    return calculateTDEE(
      {
        weight_kg: draft.weight_kg,
        height_cm: draft.height_cm,
        age: draft.age,
        gender: draft.gender,
        activity_level: draft.activity_level,
      },
      goalType,
      { target_weight_kg: draft.target_weight_kg, pace_kg_per_week: pace }
    );
  }, [
    draft.weight_kg,
    draft.height_cm,
    draft.age,
    draft.gender,
    draft.activity_level,
    draft.target_weight_kg,
    goalType,
    pace,
  ]);

  const [dailyCalories, setDailyCalories] = useState(
    draft.daily_calorie_goal
      ? String(draft.daily_calorie_goal)
      : String(suggested.recommendedCalories)
  );
  const manuallyEdited = useRef(Boolean(draft.daily_calorie_goal));
  useEffect(() => {
    if (!manuallyEdited.current) {
      setDailyCalories(String(suggested.recommendedCalories));
    }
  }, [suggested.recommendedCalories]);

  const handleCaloriesChange = (val: string) => {
    manuallyEdited.current = true;
    setDailyCalories(val);
  };

  const handlePaceChange = (next: number) => {
    updateDraft({ pace_kg_per_week: next });
  };
  const [protein, setProtein] = useState(
    draft.target_protein ? String(draft.target_protein) : ''
  );
  const [carbs, setCarbs] = useState(
    draft.target_carbs ? String(draft.target_carbs) : ''
  );
  const [fat, setFat] = useState(draft.target_fat ? String(draft.target_fat) : '');

  const handleContinue = () => {
    updateDraft({
      daily_calorie_goal: dailyCalories ? parseInt(dailyCalories) : suggested.recommendedCalories,
      target_protein: protein ? parseInt(protein) : undefined,
      target_carbs: carbs ? parseInt(carbs) : undefined,
      target_fat: fat ? parseInt(fat) : undefined,
    });
    router.push('/onboarding/completion');
  };

  const handleSkip = () => {
    updateDraft({
      daily_calorie_goal: suggested.recommendedCalories,
    });
    router.push('/onboarding/completion');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your Goals</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Set your daily nutrition targets (optional)
          </Text>
        </View>

        {/* Input Fields */}
        <View style={styles.form}>
          {showPace && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Weekly pace
              </Text>
              <View style={styles.paceRow}>
                {PACE_OPTIONS_KG_PER_WEEK.map((opt) => {
                  const selected = Math.abs(pace - opt) < 0.001;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => handlePaceChange(opt)}
                      style={({ pressed }) => [
                        styles.paceChip,
                        {
                          borderColor: selected ? colors.caloriePositive : colors.border,
                          backgroundColor: selected
                            ? colors.caloriePositive + '1A'
                            : colors.cardBackground,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.paceChipText,
                          { color: selected ? colors.caloriePositive : colors.text },
                        ]}
                      >
                        {opt} kg/wk
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {suggested.weeksToGoal !== null && (
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  ≈ {suggested.weeksToGoal} weeks to reach {draft.target_weight_kg} kg
                </Text>
              )}
            </View>
          )}

          {/* Daily Calories */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Daily Calorie Goal</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  }
                ]}
                placeholder="2000"
                placeholderTextColor={colors.placeholder}
                value={dailyCalories}
                onChangeText={handleCaloriesChange}
                keyboardType="numeric"
              />
              <Text style={[styles.unit, { color: colors.textSecondary }]}>cal</Text>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Suggested for your goal: {suggested.recommendedCalories} cal/day
            </Text>
          </View>

          {/* Macro Goals */}
          <View style={styles.macrosSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Macronutrient Goals (Optional)
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Set daily targets for proteins, carbs, and fats
            </Text>

            <View style={styles.macroInputs}>
              {/* Protein */}
              <View style={styles.macroInputGroup}>
                <Text style={[styles.macroLabel, { color: colors.text }]}>Protein</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[
                      styles.macroInput,
                      {
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      }
                    ]}
                    placeholder="150"
                    placeholderTextColor={colors.placeholder}
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>g</Text>
                </View>
              </View>

              {/* Carbs */}
              <View style={styles.macroInputGroup}>
                <Text style={[styles.macroLabel, { color: colors.text }]}>Carbs</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[
                      styles.macroInput,
                      {
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      }
                    ]}
                    placeholder="200"
                    placeholderTextColor={colors.placeholder}
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>g</Text>
                </View>
              </View>

              {/* Fat */}
              <View style={styles.macroInputGroup}>
                <Text style={[styles.macroLabel, { color: colors.text }]}>Fat</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[
                      styles.macroInput,
                      {
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      }
                    ]}
                    placeholder="65"
                    placeholderTextColor={colors.placeholder}
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>g</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View style={[styles.actions, { backgroundColor: colors.background }]}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.caloriePositive, opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { opacity: pressed ? 0.6 : 1 }
          ]}
          onPress={handleSkip}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
            Skip for now
          </Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 160, // Space for fixed buttons
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  form: {
    gap: 28,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  inputWithUnit: {
    position: 'relative',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    borderWidth: 1,
  },
  unit: {
    position: 'absolute',
    right: 16,
    top: 14,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  hint: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  paceRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  paceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  paceChipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  macrosSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  macroInputs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  macroInputGroup: {
    flex: 1,
    gap: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  macroInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 36,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    borderWidth: 1,
    textAlign: 'center',
  },
  macroUnit: {
    position: 'absolute',
    right: 12,
    top: 12,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
