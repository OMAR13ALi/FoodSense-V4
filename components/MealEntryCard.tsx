/**
 * MealEntryCard - Displays a meal entry with text and calorie information
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { MealEntry } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface MealEntryCardProps {
  meal: MealEntry;
  onPress?: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
}

export const MealEntryCard: React.FC<MealEntryCardProps> = ({ meal, onPress, onLongPress, onDelete }) => {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];

  // Render delete button on right swipe
  const renderRightActions = () => (
    <Pressable
      onPress={onDelete}
      style={[styles.deleteButton, { backgroundColor: colors.error }]}
    >
      <IconSymbol name="trash" size={24} color="#fff" />
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  const cardContent = (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.container,
        {
          opacity: pressed ? 0.5 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={[styles.mealText, { color: colors.text }]} numberOfLines={2}>
            {meal.text}
          </Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={[styles.calorieText, { color: colors.caloriePositive }]}>
            + {meal.calories.toLocaleString()} cal
          </Text>
        </View>
      </View>
    </Pressable>
  );

  // Only wrap in Swipeable if onDelete is provided
  if (onDelete) {
    return (
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
      >
        {cardContent}
      </Swipeable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    paddingRight: 16,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  mealText: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.24,
  },
  calorieText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginLeft: 8,
    marginBottom: 8,
    borderRadius: 12,
  },
  deleteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});
