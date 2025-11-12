/**
 * AnimatedCalorieText - Smooth 3-phase animated calorie display
 * Phase 1: "calculating..." slides down
 * Phase 2: Mini circular source logos appear
 * Phase 3: Final calorie number slides down
 */

import React, { useEffect, useRef } from 'react';
import { Text, Animated, Pressable, StyleSheet, Easing } from 'react-native';
import { CalorieAnimationStatus } from '@/types';
import { SourceCircles } from '@/components/SourceCircles';

interface AnimatedCalorieTextProps {
  status: CalorieAnimationStatus;
  calories?: number;
  sources?: string[];
  textSecondaryColor: string;
  caloriePositiveColor: string;
  onPress?: () => void;
}

export const AnimatedCalorieText: React.FC<AnimatedCalorieTextProps> = ({
  status,
  calories = 0,
  sources = [],
  textSecondaryColor,
  caloriePositiveColor,
  onPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;
  const previousStatus = useRef<CalorieAnimationStatus>('idle');

  useEffect(() => {
    // Skip animation if status hasn't changed
    if (previousStatus.current === status) {
      return;
    }

    previousStatus.current = status;

    if (status === 'calculating') {
      // Phase 1: Slide down "calculating..." from top
      translateYAnim.setValue(-20);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
    } else if (status === 'sources') {
      // Phase 2: Fade out calculating, then fade in circles
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        // After calculating fades out, fade in circles
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
      
    } else if (status === 'done') {
      // Phase 3: Fade out circles, then slide in final number
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        // Reset for final animation
        translateYAnim.setValue(-30);
        scaleAnim.setValue(0.9);
        fadeAnim.setValue(0);
        
        // Slide down final number with spring physics
        Animated.parallel([
          Animated.spring(translateYAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.0,
            friction: 10,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [status, fadeAnim, scaleAnim, translateYAnim, sources]);

  // Render based on status
  if (status === 'idle') {
    return null;
  }

  if (status === 'calculating') {
    // Phase 1: Show "calculating..." sliding down
    return (
      <Animated.Text
        style={[
          styles.text,
          { 
            color: textSecondaryColor,
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        calculating...
      </Animated.Text>
    );
  }

  if (status === 'sources') {
    // Phase 2: Show mini circular source logos
    // DEBUG: Log sources phase
    console.log('[AnimatedCalorieText] Sources phase:', { sources, sourcesLength: sources.length });

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <SourceCircles
          key={sources.join('|')} // Force re-mount when sources change
          sources={sources}
          loading={sources.length === 0} // Show loading circles if no sources yet
        />
      </Animated.View>
    );
  }

  if (status === 'done') {
    // Phase 3: Show final calorie number sliding down
    return (
      <Pressable onPress={onPress} disabled={!onPress}>
        <Animated.Text
          style={[
            styles.text,
            {
              color: caloriePositiveColor,
              opacity: fadeAnim,
              transform: [
                { translateY: translateYAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          + {calories} cal
        </Animated.Text>
      </Pressable>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
});
