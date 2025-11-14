/**
 * ParticleEffect - Simple particle system for calorie reveals
 * Displays N particles that fade out and float up
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ParticleEffectProps {
  count: number; // Number of particles (0 = disabled, 3 = balanced, 6 = full)
  color?: string; // Particle color
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  count,
  color = '#4CAF50',
}) => {
  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Particle key={index} index={index} color={color} totalCount={count} />
      ))}
    </View>
  );
};

interface ParticleProps {
  index: number;
  color: string;
  totalCount: number;
}

const Particle: React.FC<ParticleProps> = ({ index, color, totalCount }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Generate random position around center
  const angle = (index / totalCount) * Math.PI * 2; // Evenly distribute around circle
  const radius = 30 + Math.random() * 20; // Random radius between 30-50
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;

  useEffect(() => {
    // Stagger the start of each particle
    const delay = index * 50;

    // Particle lifecycle animation
    Animated.sequence([
      // Delay before starting
      Animated.delay(delay),
      // Appear quickly
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Float up and fade out
      Animated.parallel([
        Animated.timing(translateYAnim, {
          toValue: -40,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index, fadeAnim, translateYAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          left: offsetX,
          top: offsetY,
          opacity: fadeAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none', // Don't block touches
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
