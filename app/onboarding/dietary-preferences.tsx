import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';
import { useOnboarding } from '@/contexts/OnboardingContext';

type DietaryPreference = 'vegetarian' | 'vegan' | 'keto' | 'paleo';

export default function DietaryPreferencesScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const router = useRouter();
  const { draft, updateDraft } = useOnboarding();

  const [preferences, setPreferences] = useState<DietaryPreference[]>(() => {
    const existing = draft.dietary_preference;
    if (existing && existing !== 'none' && existing !== 'pescatarian') {
      return [existing as DietaryPreference];
    }
    return [];
  });
  const [allergies, setAllergies] = useState(
    draft.allergies ? draft.allergies.join(', ') : ''
  );

  const togglePreference = (pref: DietaryPreference) => {
    if (preferences.includes(pref)) {
      setPreferences(preferences.filter(p => p !== pref));
    } else {
      setPreferences([...preferences, pref]);
    }
  };

  const handleContinue = () => {
    updateDraft({
      dietary_preference: preferences[0] ?? 'none',
      allergies: allergies
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0),
    });
    router.push('/onboarding/goals');
  };

  const handleSkip = () => {
    router.push('/onboarding/goals');
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
          <Text style={[styles.title, { color: colors.text }]}>Dietary Preferences</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Let us know your dietary restrictions (optional)
          </Text>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Diet Type</Text>
          <View style={styles.preferenceGrid}>
            <PreferenceButton
              label="Vegetarian"
              selected={preferences.includes('vegetarian')}
              onPress={() => togglePreference('vegetarian')}
              colors={colors}
            />
            <PreferenceButton
              label="Vegan"
              selected={preferences.includes('vegan')}
              onPress={() => togglePreference('vegan')}
              colors={colors}
            />
            <PreferenceButton
              label="Keto"
              selected={preferences.includes('keto')}
              onPress={() => togglePreference('keto')}
              colors={colors}
            />
            <PreferenceButton
              label="Paleo"
              selected={preferences.includes('paleo')}
              onPress={() => togglePreference('paleo')}
              colors={colors}
            />
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Allergies</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.border,
              }
            ]}
            placeholder="e.g., peanuts, shellfish, dairy"
            placeholderTextColor={colors.placeholder}
            value={allergies}
            onChangeText={setAllergies}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Separate multiple allergies with commas
          </Text>
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

function PreferenceButton({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.preferenceButton,
        {
          backgroundColor: selected ? colors.caloriePositive : colors.cardBackground,
          borderColor: selected ? colors.caloriePositive : colors.border,
          opacity: pressed ? 0.8 : 1,
        }
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.preferenceButtonText,
          { color: selected ? '#FFFFFF' : colors.text }
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  preferenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  preferenceButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  preferenceButtonText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    borderWidth: 1,
    minHeight: 80,
  },
  hint: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginTop: 6,
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
