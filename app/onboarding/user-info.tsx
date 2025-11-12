import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';
import { OnboardingData } from '@/types';

export default function UserInfoScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const router = useRouter();

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);

  const handleContinue = () => {
    // Store data in async storage or context if needed
    const userInfo: Partial<OnboardingData> = {
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
    };

    // TODO: Store onboarding data in context or async storage
    console.log('User info:', userInfo);

    router.push('/onboarding/dietary-preferences');
  };

  const handleSkip = () => {
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>About You</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Help us personalize your experience (optional)
          </Text>
        </View>

        {/* Input Fields */}
        <View style={styles.form}>
          {/* Height */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Height (cm)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              placeholder="e.g., 170"
              placeholderTextColor={colors.placeholder}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
          </View>

          {/* Weight */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Weight (kg)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              placeholder="e.g., 70"
              placeholderTextColor={colors.placeholder}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </View>

          {/* Age */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Age</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              placeholder="e.g., 25"
              placeholderTextColor={colors.placeholder}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
            <View style={styles.genderOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.genderButton,
                  {
                    backgroundColor: gender === 'male' ? colors.caloriePositive : colors.cardBackground,
                    borderColor: gender === 'male' ? colors.caloriePositive : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  }
                ]}
                onPress={() => setGender('male')}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    { color: gender === 'male' ? '#FFFFFF' : colors.text }
                  ]}
                >
                  Male
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.genderButton,
                  {
                    backgroundColor: gender === 'female' ? colors.caloriePositive : colors.cardBackground,
                    borderColor: gender === 'female' ? colors.caloriePositive : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  }
                ]}
                onPress={() => setGender('female')}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    { color: gender === 'female' ? '#FFFFFF' : colors.text }
                  ]}
                >
                  Female
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.genderButton,
                  {
                    backgroundColor: gender === 'other' ? colors.caloriePositive : colors.cardBackground,
                    borderColor: gender === 'other' ? colors.caloriePositive : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  }
                ]}
                onPress={() => setGender('other')}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    { color: gender === 'other' ? '#FFFFFF' : colors.text }
                  ]}
                >
                  Other
                </Text>
              </Pressable>
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
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
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
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  genderButtonText: {
    fontSize: 16,
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
