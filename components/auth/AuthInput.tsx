import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/mockData';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  secureTextEntry?: boolean;
}

export function AuthInput({ label, error, secureTextEntry, ...props }: AuthInputProps) {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const inputSecureTextEntry = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.cardBackground,
              color: colors.text,
              borderColor: error ? '#FF3B30' : colors.border,
            }
          ]}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={inputSecureTextEntry}
          autoCapitalize="none"
          {...props}
        />
        {secureTextEntry && (
          <Pressable
            style={styles.toggleButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 60,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    borderWidth: 1,
  },
  toggleButton: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  error: {
    fontSize: 13,
    fontWeight: '400',
    color: '#FF3B30',
    letterSpacing: -0.1,
  },
});
