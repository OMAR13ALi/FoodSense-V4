import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoalType } from '@/types';
import { fonts } from '@/constants/design';

interface GoalSummaryCardProps {
  goalType?: GoalType;
  startWeight?: number;
  currentWeight?: number;
  targetWeight?: number;
  dailyCalorieGoal: number;
  cardBackground: string;
  textColor: string;
  textSecondaryColor: string;
}

interface GoalMeta {
  emoji: string;
  label: string;
  gradient: [string, string];
  accent: string;
  tint: string;
}

function metaFor(goalType?: GoalType): GoalMeta {
  switch (goalType) {
    case 'weight_loss':
      return { emoji: '🎯', label: 'Lose Weight', gradient: ['#EFF6FF', '#FFFFFF'], accent: '#1D4ED8', tint: '#DBEAFE' };
    case 'weight_gain':
      return { emoji: '📈', label: 'Gain Weight', gradient: ['#F0FDF4', '#FFFFFF'], accent: '#15803D', tint: '#DCFCE7' };
    case 'muscle_gain':
      return { emoji: '💪', label: 'Build Muscle', gradient: ['#FAF5FF', '#FFFFFF'], accent: '#7E22CE', tint: '#F3E8FF' };
    case 'maintenance':
    default:
      return { emoji: '⚖️', label: 'Maintain', gradient: ['#FEF3C7', '#FFFFFF'], accent: '#B45309', tint: '#FEF3C7' };
  }
}

function buildSentence(
  goalType: GoalType | undefined,
  current?: number,
  target?: number,
): string {
  if (!current || !target || !goalType) {
    return 'Set your current and target weight in Profile to track progress.';
  }
  const delta = current - target;
  const abs = Math.abs(delta);
  if (goalType === 'maintenance') {
    if (abs <= 1) return `You're within ${abs.toFixed(1)} kg of your target — holding steady.`;
    return `You're ${abs.toFixed(1)} kg ${delta > 0 ? 'above' : 'below'} your maintenance target.`;
  }

  const targetDirection = goalType === 'weight_loss' ? 'below' : 'above';
  const isDone =
    (goalType === 'weight_loss' && current <= target) ||
    ((goalType === 'weight_gain' || goalType === 'muscle_gain') && current >= target);

  if (isDone) return `Target reached — you're at or ${targetDirection} your goal weight. 🎉`;

  return `${abs.toFixed(1)} kg to go to reach your ${target} kg target.`;
}

function percentOf(current?: number, target?: number, start?: number): number | null {
  if (!current || !target || !start || start === target) return null;
  const total = Math.abs(target - start);
  const covered = Math.abs(current - start);
  return Math.max(0, Math.min(covered / total, 1));
}

export function GoalSummaryCard({
  goalType,
  startWeight,
  currentWeight,
  targetWeight,
  dailyCalorieGoal,
  cardBackground,
  textColor,
  textSecondaryColor,
}: GoalSummaryCardProps) {
  const meta = metaFor(goalType);
  const sentence = buildSentence(goalType, currentWeight, targetWeight);
  const pct = percentOf(currentWeight, targetWeight, startWeight ?? currentWeight);

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      <LinearGradient colors={meta.gradient} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={[styles.emojiBubble, { backgroundColor: meta.tint }]}>
            <Text style={styles.emoji}>{meta.emoji}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>YOUR GOAL</Text>
            <Text style={[styles.goalLabel, { color: meta.accent }]}>{meta.label}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={[styles.sentence, { color: textColor }]}>{sentence}</Text>

        <View style={[styles.statsRow, { borderTopColor: '#F3F4F6' }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: textColor }]}>
              {currentWeight ? `${currentWeight} kg` : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Current</Text>
          </View>
          <View style={[styles.stat, styles.statCenter]}>
            <Text style={[styles.statValue, styles.statValueAccent, { color: meta.accent }]}>
              {dailyCalorieGoal > 0 ? dailyCalorieGoal.toLocaleString() : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Daily Cal</Text>
          </View>
          <View style={[styles.stat, styles.statRight]}>
            <Text style={[styles.statValue, { color: textColor }]}>
              {targetWeight ? `${targetWeight} kg` : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Target</Text>
          </View>
        </View>

        {pct !== null && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(pct * 100)}%`, backgroundColor: meta.accent },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: textSecondaryColor }]}>
              {Math.round(pct * 100)}% of the way there
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emojiBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  goalLabel: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  sentence: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  stat: {
    flex: 1,
  },
  statCenter: {
    alignItems: 'center',
  },
  statRight: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  statValueAccent: {
    fontSize: 22,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  progressWrap: {
    marginTop: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
});
