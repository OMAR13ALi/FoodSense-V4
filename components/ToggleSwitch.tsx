/**
 * ToggleSwitch - Custom toggle switch component
 */

import React from 'react';
import { Switch, Platform, SwitchProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/constants/mockData';

interface ToggleSwitchProps extends SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onValueChange, ...props }) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        false: colors.border,
        true: colors.primary,
      }}
      thumbColor={Platform.OS === 'ios' ? undefined : colors.cardBackground}
      ios_backgroundColor={colors.border}
      {...props}
    />
  );
};
