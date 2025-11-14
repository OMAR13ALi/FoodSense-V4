/**
 * SourceCircles - Mini circular badges showing data sources
 * Displays up to 3 source logos with staggered entrance animation
 * Each circle manages its own animation state to prevent array mismatch errors
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { getSourceIcon } from '@/components/SourceIcon';
import { AnimationIntensity } from '@/types';
import { getAnimationConfig } from '@/utils/animationConfigs';

interface SourceCirclesProps {
  sources: string[];
  darkMode?: boolean;
  loading?: boolean; // Show placeholder circles while sources load
  intensity?: AnimationIntensity;
}

export const SourceCircles: React.FC<SourceCirclesProps> = ({
  sources,
  darkMode = false,
  loading = false,
  intensity = 'full'
}) => {
  const config = getAnimationConfig(intensity);
  // DEBUG: Log rendering state
  console.log('[SourceCircles] Rendering:', { sourcesLength: sources.length, loading, sources });

  // Always show 3 circles for consistent array length (helps React reconciliation)
  let displaySources: string[];
  if (loading || sources.length === 0) {
    // Show 3 loading placeholders
    displaySources = ['Loading', 'Loading', 'Loading'];
  } else {
    // Show real sources, pad to 3 if needed
    displaySources = [...sources.slice(0, 3)];
    // Pad with empty strings if less than 3 (don't render empty ones)
    while (displaySources.length < 3 && sources.length < 3) {
      displaySources.push(''); // Empty placeholder (won't render)
    }
  }

  // Filter out empty strings for final render
  const visibleSources = displaySources.filter(s => s !== '');

  // Always show circles (never return null)
  console.log('[SourceCircles] Displaying:', visibleSources);

  return (
    <View style={styles.container}>
      {visibleSources.map((source, index) => (
        <AnimatedCircle 
          key={`${source}-${index}`} 
          source={source}
          index={index}
          darkMode={darkMode}
          config={config}
        />
      ))}
    </View>
  );
};

// Separate component for each circle with its own animation state
// This prevents array length mismatch errors
const AnimatedCircle: React.FC<{
  source: string;
  index: number;
  darkMode?: boolean;
  config: ReturnType<typeof getAnimationConfig>;
}> = ({ source, index, darkMode, config }) => {
  // Single animated value per visual property (prevents mixing/conflicts)
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Store animation references for proper cleanup
  const animationsRef = useRef<{
    entrance?: Animated.CompositeAnimation;
    pulseScale?: Animated.CompositeAnimation;
    pulseOpacity?: Animated.CompositeAnimation;
    rotate?: Animated.CompositeAnimation;
  }>({});

  useEffect(() => {
    // DEBUG: Track component lifecycle
    console.log(`[AnimatedCircle] Mounted/Updated: source="${source}", index=${index}`);

    // CRITICAL: Stop ALL existing animations first to prevent conflicts
    Object.values(animationsRef.current).forEach(anim => {
      anim?.stop();
    });
    animationsRef.current = {};

    // Reset values with stopAnimation to ensure clean state
    scaleAnim.stopAnimation(() => scaleAnim.setValue(0));
    opacityAnim.stopAnimation(() => opacityAnim.setValue(0));
    rotateAnim.stopAnimation(() => rotateAnim.setValue(0));

    // Skip animation if duration is 0 (OFF mode)
    if (config.phase2.duration === 0) {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      return;
    }

    // Step 1: Entrance animation (runs for ALL modes)
    const entranceAnimations = config.phase2.explosion
      ? [
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            delay: index * 50,
            useNativeDriver: true,
          }),
          Animated.spring(opacityAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            delay: index * 50,
            useNativeDriver: true,
          }),
        ]
      : [
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: config.phase2.duration,
            delay: index * 50,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: config.phase2.duration,
            delay: index * 50,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ];

    // Step 2: Store and start entrance animation
    animationsRef.current.entrance = Animated.parallel(entranceAnimations);
    animationsRef.current.entrance.start(({ finished }) => {
      // Only start loops if entrance animation completed (not interrupted)
      if (!finished) return;

      // Start continuous loops (FULL mode only)
      
      // Pulse loop (FULL mode)
      if (config.phase2.pulsingGlow) {
        // Pulse scale: 1.0 → 1.15 → 1.0
        animationsRef.current.pulseScale = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.15,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1.0,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
        animationsRef.current.pulseScale.start();

        // Pulse opacity: 1.0 → 0.7 → 1.0
        animationsRef.current.pulseOpacity = Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.7,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1.0,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
        animationsRef.current.pulseOpacity.start();
      }

      // Orbital rotation loop (FULL mode)
      if (config.phase2.orbital) {
        animationsRef.current.rotate = Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 360,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        animationsRef.current.rotate.start();
      }
    });

    return () => {
      console.log(`[AnimatedCircle] Unmounting: source="${source}", index=${index}`);
      // Cleanup: stop all animations explicitly
      Object.values(animationsRef.current).forEach(anim => {
        anim?.stop();
      });
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [source, index, config]); // ✅ FIXED: Removed animated values from deps (they're stable refs)

  // Enhanced shadow for FULL mode (static, not animated)
  // Note: shadowRadius/shadowOpacity can't use native driver, so we use static values
  // The pulsing scale + opacity already create the "glow" effect
  const shadowRadius = config.phase2.pulsingGlow ? 4 : 2;
  const shadowOpacity = config.phase2.pulsingGlow ? 0.2 : 0.1;

  return (
    <Animated.View
      style={[
        styles.circle,
        darkMode && styles.circleDark,
        {
          opacity: opacityAnim,              // ONE source for opacity
          shadowRadius: shadowRadius,         // Static
          shadowOpacity: shadowOpacity,       // Static
          elevation: config.phase2.pulsingGlow ? 4 : 1, // Android elevation
          transform: [
            { scale: scaleAnim },             // ONE source for scale
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            }
          ]
        }
      ]}
    >
      <Text style={styles.icon}>
        {getSourceIcon(source)}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  circleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  icon: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
});
