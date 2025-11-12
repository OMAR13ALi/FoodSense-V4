/**
 * Source Icon Component
 * Maps nutrition data sources to visual emoji icons
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface SourceIconProps {
  source: string;
  size?: number;
}

/**
 * Map source names to emoji icons
 */
export function getSourceIcon(source: string): string {
  const lowerSource = source.toLowerCase();

  // Loading placeholder
  if (lowerSource.includes('loading')) {
    return '⏳';
  }

  // USDA sources
  if (lowerSource.includes('usda') || lowerSource.includes('fooddata')) {
    return '🇺🇸';
  }

  // Cached sources
  if (lowerSource.includes('cached') || lowerSource.includes('cache')) {
    return '⚡';
  }

  // Web search
  if (lowerSource.includes('web') || lowerSource.includes('search') || lowerSource.includes('perplexity')) {
    return '🌐';
  }

  // Nutritionix
  if (lowerSource.includes('nutritionix')) {
    return '💚';
  }

  // Scientific/Research
  if (lowerSource.includes('scientific') || lowerSource.includes('journal') || lowerSource.includes('research')) {
    return '🔬';
  }

  // Database
  if (lowerSource.includes('database') || lowerSource.includes('data')) {
    return '📊';
  }

  // API
  if (lowerSource.includes('api')) {
    return '🔌';
  }

  // Local cache
  if (lowerSource.includes('local')) {
    return '💾';
  }

  // Default
  return '📝';
}

/**
 * Get a short label for the source
 */
export function getSourceLabel(source: string): string {
  const lowerSource = source.toLowerCase();

  if (lowerSource.includes('usda')) return 'USDA';
  if (lowerSource.includes('cached') && !lowerSource.includes('local')) return 'Cache';
  if (lowerSource.includes('local cache')) return 'Recent';
  if (lowerSource.includes('web') || lowerSource.includes('search')) return 'Web';
  if (lowerSource.includes('nutritionix')) return 'Nutritionix';
  if (lowerSource.includes('scientific')) return 'Research';
  if (lowerSource.includes('database')) return 'Database';
  if (lowerSource.includes('perplexity')) return 'AI Search';

  // Truncate long sources
  if (source.length > 20) {
    return source.substring(0, 17) + '...';
  }

  return source;
}

/**
 * Single source icon component
 */
export function SourceIcon({ source, size = 20 }: SourceIconProps) {
  const icon = getSourceIcon(source);
  const label = getSourceLabel(source);

  return (
    <View style={styles.container}>
      <Text style={[styles.icon, { fontSize: size }]}>{icon}</Text>
      <Text style={[styles.label, { fontSize: size * 0.6 }]}>{label}</Text>
    </View>
  );
}

/**
 * Multiple sources component (horizontal row)
 */
interface SourceIconsProps {
  sources: string[];
  size?: number;
}

export function SourceIcons({ sources, size = 20 }: SourceIconsProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <View style={styles.sourcesContainer}>
      {sources.map((source, index) => (
        <SourceIcon key={index} source={source} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginVertical: 8,
  },
});
