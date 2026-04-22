import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { WeightLog, GoalType } from '@/types';
import { fonts } from '@/constants/design';

const SCREEN_WIDTH = Dimensions.get('window').width;

const LINE_COLOR = '#2563EB';
const TARGET_LINE_COLOR = '#F43F5E';
const CHIP_BG = '#EFF6FF';
const CHIP_TEXT = '#2563EB';

interface WeightProgressCardProps {
  logs: WeightLog[];
  targetWeight?: number;
  goalType?: GoalType;
  cardBackground: string;
  textColor: string;
  textSecondaryColor: string;
  successColor: string;
  primaryColor: string;
  borderColor: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WeightProgressCard({
  logs,
  targetWeight,
  goalType = 'maintenance',
  cardBackground,
  textColor,
  textSecondaryColor,
  successColor,
  primaryColor,
  borderColor,
}: WeightProgressCardProps) {
  if (logs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: cardBackground }]}>
        <Text style={[styles.title, { color: textColor }]}>Weight Progress</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⚖️</Text>
          <Text style={[styles.emptyText, { color: textColor }]}>No weight logged yet</Text>
          <Text style={[styles.emptySubtext, { color: textSecondaryColor }]}>
            Log your weight in Profile to track progress
          </Text>
        </View>
      </View>
    );
  }

  const startWeight = logs[0].weight_kg;
  const currentWeight = logs[logs.length - 1].weight_kg;
  const delta = currentWeight - startWeight;

  const movingTowardGoal =
    (goalType === 'weight_loss' && delta < 0) ||
    (goalType === 'weight_gain' && delta > 0) ||
    (goalType === 'muscle_gain' && delta > 0) ||
    goalType === 'maintenance';

  const deltaColor = movingTowardGoal ? successColor : primaryColor;

  const chartData = logs.map((log, index) => ({
    value: log.weight_kg,
    label: index === 0 || index === logs.length - 1 ? formatDate(log.logged_at) : '',
    dataPointText: '',
  }));

  const allValues = logs.map(l => l.weight_kg);
  if (targetWeight) allValues.push(targetWeight);
  const minVal = Math.min(...allValues) - 2;
  const maxVal = Math.max(...allValues) + 2;

  return (
    <View style={[styles.container, { backgroundColor: cardBackground }]}>
      <Text style={[styles.title, { color: textColor }]}>Weight Progress</Text>

      <LineChart
        data={chartData}
        width={SCREEN_WIDTH - 80}
        height={200}
        spacing={Math.max(24, (SCREEN_WIDTH - 100) / Math.max(logs.length - 1, 1))}
        initialSpacing={16}
        endSpacing={16}
        color={LINE_COLOR}
        thickness={3}
        startFillColor={LINE_COLOR + '30'}
        endFillColor={LINE_COLOR + '08'}
        startOpacity={0.5}
        endOpacity={0.05}
        areaChart
        curved
        hideDataPoints={logs.length > 15}
        dataPointsColor={LINE_COLOR}
        dataPointsRadius={5}
        yAxisColor={borderColor}
        xAxisColor={borderColor}
        yAxisTextStyle={{ color: textSecondaryColor, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: textSecondaryColor, fontSize: 10 }}
        noOfSections={4}
        maxValue={maxVal}
        mostNegativeValue={minVal}
        animateOnDataChange
        animationDuration={600}
        referenceLine1Config={
          targetWeight
            ? {
                value: targetWeight,
                color: TARGET_LINE_COLOR,
                dashWidth: 6,
                dashGap: 4,
                thickness: 1.5,
                labelText: `Goal: ${targetWeight}kg`,
                labelTextStyle: { color: TARGET_LINE_COLOR, fontSize: 10 },
              }
            : undefined
        }
      />

      {/* Stat chips */}
      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: CHIP_BG }]}>
          <Text style={[styles.chipLabel, { color: textSecondaryColor }]}>Start</Text>
          <Text style={[styles.chipValue, { color: CHIP_TEXT }]}>{startWeight} kg</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: CHIP_BG }]}>
          <Text style={[styles.chipLabel, { color: textSecondaryColor }]}>Current</Text>
          <Text style={[styles.chipValue, { color: CHIP_TEXT }]}>{currentWeight} kg</Text>
        </View>
        {targetWeight && (
          <View style={[styles.chip, { backgroundColor: CHIP_BG }]}>
            <Text style={[styles.chipLabel, { color: textSecondaryColor }]}>Goal</Text>
            <Text style={[styles.chipValue, { color: TARGET_LINE_COLOR }]}>{targetWeight} kg</Text>
          </View>
        )}
      </View>

      {logs.length > 1 && (
        <Text style={[styles.deltaText, { color: deltaColor }]}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg since start
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  chipValue: {
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
