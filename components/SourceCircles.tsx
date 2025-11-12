/**
 * SourceCircles - Mini circular badges showing data sources
 * Displays up to 3 source logos with staggered entrance animation
 * Each circle manages its own animation state to prevent array mismatch errors
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { getSourceIcon } from '@/components/SourceIcon';

interface SourceCirclesProps {
  sources: string[];
  darkMode?: boolean;
  loading?: boolean; // Show placeholder circles while sources load
}

export const SourceCircles: React.FC<SourceCirclesProps> = ({
  sources,
  darkMode = false,
  loading = false
}) => {
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
}> = ({ source, index, darkMode }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // DEBUG: Track component lifecycle
    console.log(`[AnimatedCircle] Mounted/Updated: source="${source}", index=${index}`);

    // Reset and animate
    animValue.setValue(0);

    Animated.timing(animValue, {
      toValue: 1,
      duration: 200,
      delay: index * 50, // Stagger by 50ms per circle
      useNativeDriver: true,
    }).start();

    return () => {
      console.log(`[AnimatedCircle] Unmounting: source="${source}", index=${index}`);
    };
  }, [source, index]);

  return (
    <Animated.View
      style={[
        styles.circle,
        darkMode && styles.circleDark,
        {
          opacity: animValue,
          transform: animValue ? [{
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            })
          }] : []
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
