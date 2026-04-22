import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StreakBadgeProps {
  streak: number;
  textColor: string;
  borderColor: string;
}

const MILESTONES = [3, 7, 14, 30];

export function StreakBadge({ streak, textColor, borderColor }: StreakBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevStreakRef = useRef(streak);

  useEffect(() => {
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;

    if (streak > 0 && MILESTONES.includes(streak) && streak !== prev) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.35,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  if (streak === 0) {
    return (
      <View style={[styles.ghostBadge, { borderColor }]}>
        <Text style={[styles.ghostText, { color: textColor }]}>Start streak</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.glowWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['#FF9500', '#FF3B30']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.badge}
      >
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.number}>{streak}</Text>
        <Text style={styles.label}>{streak === 1 ? 'day' : 'days'}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowWrapper: {
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    minHeight: 48,
  },
  flame: {
    fontSize: 24,
  },
  number: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  ghostBadge: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  ghostText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  },
});
