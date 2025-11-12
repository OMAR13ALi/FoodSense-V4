import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';

export default function WelcomeScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to{'\n'}FoodSense
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your nutrition with the power of AI
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            title="Quick & Easy"
            description="Just type what you eat, AI does the rest"
            color={colors.text}
            secondaryColor={colors.textSecondary}
          />
          <FeatureItem
            title="Smart Analysis"
            description="Get instant nutrition breakdown for any food"
            color={colors.text}
            secondaryColor={colors.textSecondary}
          />
          <FeatureItem
            title="Track Progress"
            description="Monitor your daily calories and macros"
            color={colors.text}
            secondaryColor={colors.textSecondary}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.caloriePositive, opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => router.push('/onboarding/user-info')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed ? 0.6 : 1 }
            ]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              I already have an account
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  title,
  description,
  color,
  secondaryColor,
}: {
  title: string;
  description: string;
  color: string;
  secondaryColor: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureDot, { backgroundColor: color }]} />
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: secondaryColor }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  features: {
    gap: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  actions: {
    gap: 16,
    marginBottom: 8,
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
});
