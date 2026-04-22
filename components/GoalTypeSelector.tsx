import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { GoalType } from '@/types';

interface GoalOption {
  type: GoalType;
  emoji: string;
  label: string;
  hint: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { type: 'weight_loss', emoji: '📉', label: 'Weight Loss', hint: '−500 cal/day' },
  { type: 'maintenance', emoji: '⚖️', label: 'Maintenance', hint: '±0 cal/day' },
  { type: 'weight_gain', emoji: '📈', label: 'Weight Gain', hint: '+300 cal/day' },
  { type: 'muscle_gain', emoji: '💪', label: 'Muscle Gain', hint: '+200 cal/day' },
];

interface GoalTypeSelectorProps {
  selected: GoalType;
  onSelect: (goalType: GoalType) => void;
  primaryColor: string;
  secondaryColor: string;
  borderColor: string;
  cardBackground: string;
  textColor: string;
  textSecondaryColor: string;
}

export function GoalTypeSelector({
  selected,
  onSelect,
  primaryColor,
  secondaryColor,
  borderColor,
  cardBackground,
  textColor,
  textSecondaryColor,
}: GoalTypeSelectorProps) {
  return (
    <View style={styles.grid}>
      {GOAL_OPTIONS.map((option) => {
        const isSelected = selected === option.type;
        return (
          <Pressable
            key={option.type}
            style={[
              styles.card,
              {
                backgroundColor: isSelected ? secondaryColor : cardBackground,
                borderColor: isSelected ? primaryColor : borderColor,
              },
            ]}
            onPress={() => onSelect(option.type)}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text style={[styles.label, { color: textColor }]}>{option.label}</Text>
            <Text style={[styles.hint, { color: isSelected ? primaryColor : textSecondaryColor }]}>
              {option.hint}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  card: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
