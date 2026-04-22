import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';

export default function CompletionScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const router = useRouter();

  const handleCreateAccount = () => {
    router.replace('/(auth)/signup');
  };

  const handleLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            You&apos;re All Set!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Create an account to save your data and access it from any device
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <BenefitItem
            title="Sync Across Devices"
            description="Access your data from phone, tablet, or web"
            color={colors.text}
            secondaryColor={colors.textSecondary}
          />
          <BenefitItem
            title="Secure Backup"
            description="Never lose your tracking history"
            color={colors.text}
            secondaryColor={colors.textSecondary}
          />
          <BenefitItem
            title="Personalized Experience"
            description="Get tailored insights based on your goals"
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
            onPress={handleCreateAccount}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed ? 0.6 : 1 }
            ]}
            onPress={handleLogin}
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

function BenefitItem({
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
    <View style={styles.benefitItem}>
      <View style={[styles.checkmark, { backgroundColor: color }]}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>
      <View style={styles.benefitText}>
        <Text style={[styles.benefitTitle, { color }]}>{title}</Text>
        <Text style={[styles.benefitDescription, { color: secondaryColor }]}>
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
  benefits: {
    gap: 28,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  benefitDescription: {
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
