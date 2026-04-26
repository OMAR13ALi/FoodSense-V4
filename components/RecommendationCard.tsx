/**
 * RecommendationCard — AI-generated coaching card shown on the Track screen.
 * Collapsed: goal emoji + one-line pacing message.
 * Expanded: pacing detail, meal suggestions, behavior tips.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRecommendations } from '@/hooks/useRecommendations';
import { GoalType } from '@/types';

interface RecommendationCardProps {
  textColor: string;
  textSecondaryColor: string;
  surfaceColor: string;
  primaryColor: string;
  accentStart: string;
  accentEnd: string;
}

function goalEmoji(goal?: GoalType): string {
  switch (goal) {
    case 'weight_loss':
      return '⚖️';
    case 'weight_gain':
      return '🍽️';
    case 'muscle_gain':
      return '💪';
    case 'maintenance':
    default:
      return '🎯';
  }
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  textColor,
  textSecondaryColor,
  surfaceColor,
  primaryColor,
  accentStart,
  accentEnd,
}) => {
  const { recommendation, loading, error, hasGoal, refresh } = useRecommendations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  if (!hasGoal) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: surfaceColor }]}>
        <Text style={styles.emptyEmoji}>🎯</Text>
        <View style={styles.emptyTextWrap}>
          <Text style={[styles.emptyTitle, { color: textColor }]}>Set a goal to unlock coaching</Text>
          <Text style={[styles.emptyBody, { color: textSecondaryColor }]}>
            Add a weight goal in Settings and we&apos;ll tailor daily suggestions for you.
          </Text>
        </View>
      </View>
    );
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

  const chevronRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const pacing = recommendation?.pacing;
  const meals = recommendation?.meal_suggestions ?? [];
  const tips = recommendation?.tips ?? [];

  // Derive emoji from the currently-selected goal; we don't keep goal_type in
  // this component, so fall back to the generic target emoji when unknown.
  const emoji = goalEmoji(undefined);

  const headlineText = loading
    ? 'Thinking through your day…'
    : error
      ? 'Coaching unavailable — tap to retry'
      : pacing?.message ?? 'Tap to see today\'s suggestions';

  const handlePress = () => {
    if (error) {
      refresh();
      return;
    }
    toggleExpanded();
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} disabled={loading}>
        <LinearGradient
          colors={[accentStart, accentEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text style={styles.headerEmoji}>{emoji}</Text>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerLabel}>Coach</Text>
            <Text style={styles.headerMessage} numberOfLines={2}>
              {headlineText}
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
              <IconSymbol name="chevron.down" size={18} color="#FFFFFF" />
            </Animated.View>
          )}
        </LinearGradient>
      </Pressable>

      {isExpanded && !loading && recommendation && (
        <View style={[styles.body, { backgroundColor: surfaceColor }]}>
          {pacing && (
            <Section title="Pacing" textColor={textColor} textSecondaryColor={textSecondaryColor}>
              <Text style={[styles.pacingMessage, { color: textColor }]}>
                {pacing.message}
              </Text>
              <View style={styles.pacingRow}>
                {pacing.suggested_daily_calories !== undefined && (
                  <PacingStat
                    label="Suggested kcal/day"
                    value={String(pacing.suggested_daily_calories)}
                    textColor={textColor}
                    textSecondaryColor={textSecondaryColor}
                  />
                )}
                {pacing.weeks_to_goal !== undefined && (
                  <PacingStat
                    label="Weeks to goal"
                    value={String(pacing.weeks_to_goal)}
                    textColor={textColor}
                    textSecondaryColor={textSecondaryColor}
                  />
                )}
              </View>
            </Section>
          )}

          {meals.length > 0 && (
            <Section title="Try eating" textColor={textColor} textSecondaryColor={textSecondaryColor}>
              {meals.map((meal, idx) => (
                <View key={idx} style={styles.mealRow}>
                  <View style={styles.mealHeaderRow}>
                    <Text style={[styles.mealName, { color: textColor }]} numberOfLines={2}>
                      {meal.name}
                    </Text>
                    <Text style={[styles.mealKcal, { color: primaryColor }]}>
                      {Math.round(meal.calories)} kcal
                    </Text>
                  </View>
                  <Text style={[styles.mealReason, { color: textSecondaryColor }]}>
                    {meal.reason}
                  </Text>
                </View>
              ))}
            </Section>
          )}

          {tips.length > 0 && (
            <Section title="Tips" textColor={textColor} textSecondaryColor={textSecondaryColor}>
              {tips.map((tip, idx) => (
                <View key={idx} style={styles.tipRow}>
                  <Text style={[styles.tipTitle, { color: textColor }]}>{tip.title}</Text>
                  <Text style={[styles.tipBody, { color: textSecondaryColor }]}>
                    {tip.message}
                  </Text>
                </View>
              ))}
            </Section>
          )}

          <Pressable onPress={() => refresh()} style={styles.refreshRow}>
            <IconSymbol name="arrow.clockwise" size={14} color={textSecondaryColor} />
            <Text style={[styles.refreshText, { color: textSecondaryColor }]}>
              Refresh for today
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

interface SectionProps {
  title: string;
  textColor: string;
  textSecondaryColor: string;
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, textSecondaryColor, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionLabel, { color: textSecondaryColor }]}>{title}</Text>
    {children}
  </View>
);

interface PacingStatProps {
  label: string;
  value: string;
  textColor: string;
  textSecondaryColor: string;
}
const PacingStat: React.FC<PacingStatProps> = ({ label, value, textColor, textSecondaryColor }) => (
  <View style={styles.pacingStat}>
    <Text style={[styles.pacingValue, { color: textColor }]}>{value}</Text>
    <Text style={[styles.pacingLabel, { color: textSecondaryColor }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  body: {
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pacingMessage: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    marginBottom: 12,
  },
  pacingRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pacingStat: {
    flex: 1,
  },
  pacingValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  pacingLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  mealRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(17, 24, 39, 0.08)',
  },
  mealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mealName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  mealKcal: {
    fontSize: 14,
    fontWeight: '700',
  },
  mealReason: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 4,
  },
  tipRow: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(17, 24, 39, 0.08)',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  tipBody: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.06)',
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyTextWrap: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
