import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';

export default function GoalsScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const router = useRouter();

  const [dailyCalories, setDailyCalories] = useState('2000');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const handleContinue = () => {
    // Store data
    const goalsData = {
      dailyCalories: dailyCalories ? parseInt(dailyCalories) : 2000,
      protein: protein ? parseInt(protein) : undefined,
      carbs: carbs ? parseInt(carbs) : undefined,
      fat: fat ? parseInt(fat) : undefined,
    };

    console.log('Goals:', goalsData);

    router.push('/onboarding/completion');
  };

  const handleSkip = () => {
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
                onChangeText={setDailyCalories}
                keyboardType="numeric"
              />
              <Text style={[styles.unit, { color: colors.textSecondary }]}>cal</Text>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Recommended: 1800-2400 calories per day
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
