/**
 * MotivationalBanner - Fun progress-based motivational messages
 * Shows encouraging emojis and messages based on calorie progress
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/constants/mockData';

interface MotivationalBannerProps {
  consumed: number;
  goal: number;
}

export const MotivationalBanner: React.FC<MotivationalBannerProps> = ({
  consumed,
  goal,
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];
  
  const percentage = (consumed / goal) * 100;
  
  // Determine message based on progress
  const getMessage = () => {
    if (consumed === 0) {
      return { emoji: '🍕', text: 'Feeling hungry? Start tracking!' };
    } else if (percentage < 25) {
      return { emoji: '🌱', text: 'Great start! Keep it up!' };
    } else if (percentage < 50) {
      return { emoji: '🔥', text: "You're on fire! Keep going!" };
    } else if (percentage < 75) {
      return { emoji: '💪', text: 'Halfway there! Strong work!' };
    } else if (percentage < 100) {
      return { emoji: '⚡', text: 'Almost there! Finish strong!' };
    } else if (percentage >= 100) {
      return { emoji: '🎉', text: 'Goal crushed! Amazing!' };
    }
    return { emoji: '✨', text: 'Keep tracking!' };
  };

  const message = getMessage();

  // Don't show banner if no calories tracked yet
  if (consumed === 0) {
    return null;
  }

  return (
    <LinearGradient
      colors={[colors.accentStart, colors.accentEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <Text style={styles.emoji}>{message.emoji}</Text>
      <Text style={styles.text}>{message.text}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  emoji: {
    fontSize: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.24,
    flex: 1,
  },
});
