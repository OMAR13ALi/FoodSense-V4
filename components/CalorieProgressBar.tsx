/**
 * CalorieProgressBar — floating bottom bar with two states.
 *
 * Collapsed (default): serif calorie number + "X left" + chevron + 2px track.
 * Expanded (on tap): serif total/goal + three macro rings + sub-nutrients
 * + "see today's meals" link.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { designColors, fonts, space } from '@/constants/design';

interface CalorieProgressBarProps {
  consumed: number;
  goal: number;
  protein?: number;
  targetProtein?: number;
  carbs?: number;
  targetCarbs?: number;
  fat?: number;
  targetFat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  onSeeMeals?: () => void;
}

const COLLAPSED_HEIGHT = 64;
const EXPANDED_HEIGHT = 280;

export const CalorieProgressBar: React.FC<CalorieProgressBarProps> = ({
  consumed,
  goal,
  protein = 0,
  targetProtein = 0,
  carbs = 0,
  targetCarbs = 0,
  fat = 0,
  targetFat = 0,
  fiber,
  sugar,
  sodium,
  onSeeMeals,
}) => {
  const colorScheme = useColorScheme();
  const c = designColors[colorScheme ?? 'light'];

  const [expanded, setExpanded] = useState(false);

  const remaining = goal - consumed;
  const progressPct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const isOver = consumed > goal;
  const isNear = !isOver && progressPct >= 0.85;

  const trackColor = isOver ? c.error : isNear ? c.warning : c.accent;
  const remainingColor = isOver ? c.error : isNear ? c.warning : c.text.secondary;

  const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const trackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(trackAnim, {
      toValue: progressPct,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressPct]);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const next = !expanded;
    setExpanded(next);
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: next ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
        damping: 18,
        stiffness: 180,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: next ? 1 : 0,
        duration: next ? 220 : 140,
        useNativeDriver: false,
      }),
      Animated.spring(chevronAnim, {
        toValue: next ? 1 : 0,
        damping: 14,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const trackWidth = trackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: c.bg.surface,
          borderTopColor: c.hairline,
          height: heightAnim,
        },
      ]}
    >
      {/* Collapsed header (always visible, tappable) */}
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.heroNum, { color: c.text.primary }]}>
            {Math.round(consumed).toLocaleString()}
          </Text>

          <View style={styles.headerRight}>
            <Text style={[styles.remainingNum, { color: remainingColor }]}>
              {isOver
                ? `+${Math.round(Math.abs(remaining)).toLocaleString()}`
                : Math.round(remaining).toLocaleString()}
            </Text>
            <Text style={[styles.remainingLabel, { color: c.text.tertiary }]}>
              {isOver ? 'over' : 'left'}
            </Text>
            <Animated.Text
              style={[
                styles.chevron,
                { color: c.text.tertiary, transform: [{ rotate: chevronRotate }] },
              ]}
            >
              ⌃
            </Animated.Text>
          </View>
        </View>

        {/* Hairline track */}
        <View style={[styles.track, { backgroundColor: c.bg.inset }]}>
          <Animated.View
            style={[styles.trackFill, { width: trackWidth, backgroundColor: trackColor }]}
          />
        </View>
      </Pressable>

      {/* Expanded panel */}
      <Animated.View
        pointerEvents={expanded ? 'auto' : 'none'}
        style={[styles.expanded, { opacity: fadeAnim }]}
      >
        <Text style={[styles.expandedGoal, { color: c.text.secondary }]}>
          of {goal.toLocaleString()} cal goal
        </Text>

        <View style={styles.ringsRow}>
          <MacroRing
            label="Protein"
            value={protein}
            target={targetProtein}
            color={c.macro.protein}
            textPrimary={c.text.primary}
            textSecondary={c.text.tertiary}
            track={c.bg.inset}
          />
          <MacroRing
            label="Carbs"
            value={carbs}
            target={targetCarbs}
            color={c.macro.carbs}
            textPrimary={c.text.primary}
            textSecondary={c.text.tertiary}
            track={c.bg.inset}
          />
          <MacroRing
            label="Fat"
            value={fat}
            target={targetFat}
            color={c.macro.fat}
            textPrimary={c.text.primary}
            textSecondary={c.text.tertiary}
            track={c.bg.inset}
          />
        </View>

        {(fiber !== undefined || sugar !== undefined || sodium !== undefined) && (
          <View style={styles.subRow}>
            {fiber !== undefined && (
              <SubNutrient label="Fiber" value={`${Math.round(fiber)}g`} c={c} />
            )}
            {sugar !== undefined && (
              <SubNutrient label="Sugar" value={`${Math.round(sugar)}g`} c={c} />
            )}
            {sodium !== undefined && (
              <SubNutrient label="Sodium" value={`${Math.round(sodium)}mg`} c={c} />
            )}
          </View>
        )}

        {onSeeMeals && (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSeeMeals();
            }}
            style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.linkText, { color: c.accent }]}>
              See today&apos;s meals →
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
};

// ---------- Macro ring ----------

const RING_SIZE = 56;
const RING_STROKE = 6;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

function MacroRing({
  label, value, target, color, textPrimary, textSecondary, track,
}: {
  label: string; value: number; target: number; color: string;
  textPrimary: string; textSecondary: string; track: string;
}) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = RING_C * (1 - pct);

  return (
    <View style={styles.ringItem}>
      <View style={styles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            stroke={track}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            stroke={color}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={`${RING_C} ${RING_C}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringInner}>
          <Text style={[styles.ringPct, { color: textPrimary }]}>
            {Math.round(pct * 100)}
          </Text>
        </View>
      </View>
      <Text style={[styles.ringLabel, { color: textPrimary }]}>{label}</Text>
      <Text style={[styles.ringValue, { color: textSecondary }]}>
        {Math.round(value)}/{target || 0}g
      </Text>
    </View>
  );
}

function SubNutrient({
  label, value, c,
}: {
  label: string;
  value: string;
  c: typeof designColors.light;
}) {
  return (
    <View style={styles.subItem}>
      <Text style={[styles.subLabel, { color: c.text.tertiary }]}>{label}</Text>
      <Text style={[styles.subValue, { color: c.text.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space[5],
    paddingTop: space[3],
    paddingBottom: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    minHeight: 44,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: space[3],
  },
  heroNum: {
    fontFamily: fonts.serif,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space[2],
  },
  remainingNum: {
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: '500',
  },
  remainingLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: -4,
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
    transform: [{ translateY: -1 }],
  },
  track: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 1,
  },
  expanded: {
    marginTop: space[4],
  },
  expandedGoal: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: space[4],
    letterSpacing: 0.1,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: space[3],
  },
  ringItem: {
    alignItems: 'center',
    flex: 1,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space[2],
  },
  ringInner: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPct: {
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: '600',
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  ringValue: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: space[2],
    marginBottom: space[2],
  },
  subItem: {
    alignItems: 'center',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  subValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  linkRow: {
    alignItems: 'center',
    paddingVertical: space[2],
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export { COLLAPSED_HEIGHT as CALORIE_BAR_COLLAPSED_HEIGHT };
export { EXPANDED_HEIGHT as CALORIE_BAR_EXPANDED_HEIGHT };
