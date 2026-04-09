/**
 * CalorieProgressBar - Bottom floating bar showing calorie progress
 * Uses Reanimated for smooth 60 FPS number transitions
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/constants/mockData';

interface CalorieProgressBarProps {
  consumed: number;
  goal: number;
  onPress?: () => void;
}

export const CalorieProgressBar: React.FC<CalorieProgressBarProps> = ({
  consumed,
  goal,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];

  // Track displayed remaining calories
  const [displayedRemaining, setDisplayedRemaining] = useState(goal - consumed);

  // Update displayed value when props change
  useEffect(() => {
    const remaining = goal - consumed;
    setDisplayedRemaining(remaining);
  }, [consumed, goal]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.labelText, { color: colors.textSecondary }]}>
          Remaining
        </Text>
        <Text style={[styles.calorieText, { color: colors.text }]}>
          {displayedRemaining.toLocaleString()} cal
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 20,
    marginBottom: Platform.OS === 'android' ? 16 : 12, // Tighter spacing above tab bar
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  calorieText: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
