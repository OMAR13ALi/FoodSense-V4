/**
 * LoadingIndicator - Animated "searching..." indicator with emoji
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS, LOADING_EMOJIS } from '@/constants/mockData';

interface LoadingIndicatorProps {
  text?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ text = 'searching' }) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];

  const [emojiIndex, setEmojiIndex] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Rotate through emojis
    const emojiInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setEmojiIndex((prev) => (prev + 1) % LOADING_EMOJIS.length);
    }, 1000);

    // Animate dots
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 400);

    return () => {
      clearInterval(emojiInterval);
      clearInterval(dotInterval);
    };
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.emoji, { opacity: fadeAnim }]}>
        {LOADING_EMOJIS[emojiIndex]}
      </Animated.Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
    gap: 8,
  },
  emoji: {
    fontSize: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
  },
});
