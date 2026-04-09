/**
 * AnimatedCalorieText - Smooth 3-phase animated calorie display
 * Phase 1: "calculating..." slides down
 * Phase 2: Mini circular source logos appear
 * Phase 3: Final calorie number slides down
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable, StyleSheet, Easing } from 'react-native';
import { CalorieAnimationStatus } from '@/types';
import { SourceCircles } from '@/components/SourceCircles';
import { ParticleEffect } from '@/components/ParticleEffect';
import { useApp } from '@/contexts/AppContext';
import { getAnimationConfig } from '@/utils/animationConfigs';

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
  const { state } = useApp();
  const config = getAnimationConfig(state.animationSettings.intensity);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;
  const colorAnim = useRef(new Animated.Value(0)).current; // For color morph
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
      
      // Skip animation if intensity is OFF
      if (config.phase1.duration === 0) {
        translateYAnim.setValue(0);
        fadeAnim.setValue(1);
        return;
      }
      
      Animated.parallel([
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: config.phase1.duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: config.phase1.duration,
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
      
      // Skip animation if intensity is OFF
      if (config.phase3.duration === 0) {
        translateYAnim.setValue(0);
        scaleAnim.setValue(1.0);
        fadeAnim.setValue(1);
        return;
      }
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        // Reset for final animation
        translateYAnim.setValue(-30);
        scaleAnim.setValue(0.9);
        fadeAnim.setValue(0);
        colorAnim.setValue(0); // Reset color animation
        
        // Slide down final number with spring or timing based on config
        const useDramaticEntrance = config.phase3.dramaticEntrance;
        
        // Run native driver animations (translateY, scale, fade)
        Animated.parallel([
          useDramaticEntrance
            ? Animated.spring(translateYAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
              })
            : Animated.timing(translateYAnim, {
                toValue: 0,
                duration: config.phase3.duration,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
          useDramaticEntrance
            ? Animated.spring(scaleAnim, {
                toValue: 1.0,
                friction: 10,
                tension: 50,
                useNativeDriver: true,
              })
            : Animated.timing(scaleAnim, {
                toValue: 1.0,
                duration: config.phase3.duration,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: config.phase3.duration,
            useNativeDriver: true,
          }),
        ]).start();

        // Run color morph separately (can't mix native and JS driver)
        if (config.phase3.colorMorph) {
          Animated.timing(colorAnim, {
            toValue: 1,
            duration: config.phase3.duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false, // Color animations can't use native driver
          }).start();
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          intensity={state.animationSettings.intensity}
        />
      </Animated.View>
    );
  }

  if (status === 'done') {
    // Phase 3: Show final calorie number sliding down
    // Calculate interpolated color if color morph is enabled
    const displayColor = config.phase3.colorMorph
      ? colorAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [textSecondaryColor, caloriePositiveColor],
        })
      : caloriePositiveColor;

    return (
      <View style={styles.doneContainer}>
        {/* Particle effect in background */}
        {config.phase3.particles > 0 && (
          <ParticleEffect
            count={config.phase3.particles}
            color={caloriePositiveColor}
          />
        )}

        {/* Main calorie text */}
        <Pressable onPress={onPress} disabled={!onPress}>
          {/* Outer View: Native driver animations (opacity, transform) */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                { translateY: translateYAnim },
                { scale: scaleAnim }
              ],
            }}
          >
            {/* Inner Text: JS driver animation (color) */}
            <Animated.Text
              style={[
                styles.text,
                {
                  color: displayColor,
                },
              ]}
            >
              + {calories} cal
            </Animated.Text>
          </Animated.View>
        </Pressable>
      </View>
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
  doneContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
