/**
 * CircularSettingsButton - Floating circular settings button with gradient
 * Apple-style elegant button positioned in top-right corner
 */

import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/constants/mockData';
import { useRouter } from 'expo-router';

export const CircularSettingsButton: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];
  const router = useRouter();

  const handlePress = () => {
    // Haptic feedback on iOS
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(tabs)/profile');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
          },
        ]}
      >
        <IconSymbol name="gearshape.fill" size={26} color="#FFFFFF" />
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 52,
    height: 52,
  },
  gradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
});
