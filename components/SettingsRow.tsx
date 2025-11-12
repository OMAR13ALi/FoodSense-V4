/**
 * SettingsRow - Reusable settings item with icon, label, and value/control
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/constants/mockData';

interface SettingsRowProps {
  emoji?: string;
  label: string;
  value?: string | number;
  rightComponent?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  emoji,
  label,
  value,
  rightComponent,
  onPress,
  showChevron = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.leftContent}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>

      <View style={styles.rightContent}>
        {rightComponent ? (
          rightComponent
        ) : value !== undefined ? (
          <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>
        ) : null}
        {showChevron && <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 20,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
});
