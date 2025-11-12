/**
 * CircularProgress - Circular progress indicator for daily summary
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS, MACRO_EMOJIS } from '@/constants/mockData';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  consumed,
  goal,
  size = 200,
  strokeWidth = 12,
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];

  const percentage = Math.min((consumed / goal) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isOverGoal = consumed > goal;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOverGoal ? colors.caloriePositive : colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center text */}
      <View style={styles.centerContent}>
        <Text style={[styles.emoji]}>{MACRO_EMOJIS.calories}</Text>
        <Text style={[styles.consumedText, { color: colors.text }]}>
          {consumed.toLocaleString()}
        </Text>
        <Text style={[styles.goalText, { color: colors.textSecondary }]}>
          / {goal.toLocaleString()}
        </Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>calories</Text>
        <Text
          style={[
            styles.percentageText,
            {
              color: isOverGoal ? colors.caloriePositive : colors.success,
            },
          ]}
        >
          {percentage.toFixed(0)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  consumedText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
});
