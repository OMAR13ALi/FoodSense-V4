import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';
import { GoalTypeSelector } from '@/components/GoalTypeSelector';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { GoalType } from '@/types';

export default function GoalTypeScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const router = useRouter();
  const { draft, updateDraft } = useOnboarding();

  const [selected, setSelected] = useState<GoalType>(draft.goal_type ?? 'maintenance');
  const [targetWeight, setTargetWeight] = useState(
    draft.target_weight_kg ? String(draft.target_weight_kg) : ''
  );

  const needsTargetWeight = selected === 'weight_loss' || selected === 'weight_gain';

  const handleContinue = () => {
    updateDraft({
      goal_type: selected,
      target_weight_kg: needsTargetWeight && targetWeight
        ? parseFloat(targetWeight)
        : undefined,
    });
    router.push('/onboarding/dietary-preferences');
  };

  const handleSkip = () => {
    updateDraft({ goal_type: 'maintenance' });
    router.push('/onboarding/dietary-preferences');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>What&apos;s Your Goal?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We&apos;ll tune your daily calorie target to match.
          </Text>
        </View>

        <GoalTypeSelector
          selected={selected}
          onSelect={setSelected}
          primaryColor={colors.caloriePositive}
          secondaryColor={colors.cardBackground}
          borderColor={colors.border}
          cardBackground={colors.cardBackground}
          textColor={colors.text}
          textSecondaryColor={colors.textSecondary}
        />

        {needsTargetWeight && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Target Weight (kg)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder={selected === 'weight_loss' ? 'e.g., 65' : 'e.g., 75'}
              placeholderTextColor={colors.placeholder}
              value={targetWeight}
              onChangeText={setTargetWeight}
              keyboardType="numeric"
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Optional — leave blank if you&apos;re not sure yet.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { backgroundColor: colors.background }]}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.caloriePositive, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.6 : 1 }]}
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 160,
  },
  header: { marginBottom: 32 },
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
  inputGroup: { gap: 8, marginTop: 16 },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    borderWidth: 1,
  },
  hint: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
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
