import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoalType, WEIGHT_MILESTONE_LABELS, WEIGHT_MILESTONE_PERCENTS } from '@/types';
import { fonts } from '@/constants/design';

const MILESTONES = Object.entries(WEIGHT_MILESTONE_PERCENTS).map(([key, percent]) => ({
  key,
  percent,
}));

interface WeightMilestoneTrackerProps {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  goalType?: GoalType;
  celebratedMilestones?: string[];
}

export function WeightMilestoneTracker({
  startWeight,
  currentWeight,
  targetWeight,
  goalType = 'weight_loss',
  celebratedMilestones = [],
}: WeightMilestoneTrackerProps) {
  const totalDistance = Math.abs(targetWeight - startWeight);
  const progressPct = totalDistance === 0
    ? 1
    : Math.min(Math.abs(currentWeight - startWeight) / totalDistance, 1);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const direction = goalType === 'weight_gain' || goalType === 'muscle_gain' ? 'gain' : 'loss';
  const headerColor = direction === 'loss' ? '#EFF6FF' : '#F0FDF4';
  const headerTextColor = direction === 'loss' ? '#1D4ED8' : '#15803D';

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={direction === 'loss' ? ['#EFF6FF', '#FFFFFF'] : ['#F0FDF4', '#FFFFFF']}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: headerTextColor }]}>
          Weight Journey
        </Text>
        <Text style={[styles.headerSubtitle, { color: headerTextColor + 'CC' }]}>
          {direction === 'loss' ? `${startWeight} kg → ${targetWeight} kg` : `${startWeight} kg → ${targetWeight} kg`}
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        {/* Progress track */}
        <View style={styles.trackContainer}>
          {/* Background line */}
          <View style={styles.lineBackground} />

          {/* Filled line */}
          <View style={[styles.lineFilled, { width: `${Math.min(progressPct * 100, 100)}%` }]} />

          {/* Milestone nodes */}
          {MILESTONES.map((m, index) => {
            const isCompleted = celebratedMilestones.includes(m.key) || progressPct >= m.percent;
            const isCurrent = !isCompleted && progressPct >= (index > 0 ? MILESTONES[index - 1].percent : 0);

            return (
              <View
                key={m.key}
                style={[styles.nodeWrapper, { left: `${m.percent * 100 - (m.percent === 1 ? 2 : m.percent * 2)}%` }]}
              >
                {isCurrent ? (
                  <Animated.View
                    style={[
                      styles.nodeOuter,
                      styles.nodeCurrentOuter,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <View style={styles.nodeCurrentInner} />
                  </Animated.View>
                ) : isCompleted ? (
                  <View style={styles.nodeOuter}>
                    <LinearGradient
                      colors={['#2563EB', '#60A5FA']}
                      style={styles.nodeCompleted}
                    >
                      <Text style={styles.checkmark}>✓</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={[styles.nodeOuter, styles.nodeFuture]} />
                )}

                <Text
                  style={[
                    styles.nodeLabel,
                    isCompleted && styles.nodeLabelCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {WEIGHT_MILESTONE_LABELS[m.key]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Progress stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{startWeight} kg</Text>
          <Text style={styles.statLabel}>Start</Text>
        </View>
        <View style={[styles.stat, styles.statCenter]}>
          <Text style={[styles.statValue, styles.statValueAccent]}>
            {Math.round(progressPct * 100)}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
        <View style={[styles.stat, styles.statRight]}>
          <Text style={styles.statValue}>{targetWeight} kg</Text>
          <Text style={styles.statLabel}>Goal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
    height: 90,
  },
  trackContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    marginTop: 10,
  },
  lineBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 18,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  lineFilled: {
    position: 'absolute',
    left: 0,
    top: 18,
    height: 4,
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
    width: 44,
    marginLeft: -22,
  },
  nodeOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeFuture: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  nodeCurrentOuter: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#2563EB',
  },
  nodeCurrentInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  nodeCompleted: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 13,
  },
  nodeLabelCompleted: {
    color: '#2563EB',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  statValueAccent: {
    color: '#2563EB',
    fontSize: 22,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 1,
  },
});
