/**
 * FavoritesPanel - Expandable quick-access list of favorite meals
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FavoriteMeal } from '@/types';

interface FavoritesPanelProps {
  favorites: FavoriteMeal[];
  onFavoriteTap: (favorite: FavoriteMeal) => void;
  isLoading?: boolean;
  textColor: string;
  textSecondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  primaryColor: string;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  favorites,
  onFavoriteTap,
  isLoading = false,
  textColor,
  textSecondaryColor,
  backgroundColor,
  surfaceColor,
  primaryColor,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  // Show top 10 most frequently used favorites
  const topFavorites = favorites.slice(0, 10);

  if (favorites.length === 0 && !isLoading) {
    return null; // Don't show panel if no favorites
  }

  const toggleExpanded = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  };

  const panelHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180], // 0 when collapsed, 180 when expanded
  });

  const chevronRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      {/* Toggle Button */}
      <Pressable
        style={[styles.toggleButton, { backgroundColor: surfaceColor }]}
        onPress={toggleExpanded}
      >
        <IconSymbol name="star.fill" size={16} color="#FFD93D" />
        <Text style={[styles.toggleText, { color: textColor }]}>
          Quick Add
        </Text>
        <Text style={[styles.countBadge, { color: textSecondaryColor }]}>
          {favorites.length}
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <IconSymbol name="chevron.right" size={18} color={textSecondaryColor} />
        </Animated.View>
      </Pressable>

      {/* Expandable Content */}
      <Animated.View style={[styles.expandableContent, { height: panelHeight, opacity: animation }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={textSecondaryColor} />
            </View>
          ) : (
            topFavorites.map((favorite) => (
              <Pressable
                key={favorite.id}
                style={[styles.favoriteCard, { backgroundColor: surfaceColor }]}
                onPress={() => onFavoriteTap(favorite)}
              >
                {favorite.emoji && (
                  <Text style={styles.emoji}>{favorite.emoji}</Text>
                )}
                <Text style={[styles.favoriteName, { color: textColor }]} numberOfLines={2}>
                  {favorite.name}
                </Text>
                <Text style={[styles.calories, { color: textSecondaryColor }]}>
                  {Math.round(favorite.calories)} cal
                </Text>
                {favorite.frequency_count > 0 && (
                  <View style={styles.frequencyBadge}>
                    <Text style={styles.frequencyText}>
                      {favorite.frequency_count}×
                    </Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  expandableContent: {
    overflow: 'hidden',
    marginTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteCard: {
    width: 110,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  favoriteName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
    minHeight: 36, // Ensure consistent card height
  },
  calories: {
    fontSize: 12,
    fontWeight: '500',
  },
  frequencyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD93D',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  frequencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
});
