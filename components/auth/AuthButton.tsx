import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: AuthButtonProps) {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];

  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: colors.caloriePositive },
        isPrimary && styles.primaryButton,
        !isPrimary && styles.secondaryButton,
        isDisabled && styles.disabled,
        { opacity: pressed && !isDisabled ? 0.8 : 1 }
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : colors.text} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.primaryText,
            !isPrimary && { color: colors.text },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.5,
  },
});
