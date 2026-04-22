import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakCalendarProps {
  mealDates: string[];
}

function getCellColor(count: number): string {
  if (count === 0) return '#F3F4F6';
  if (count === 1) return '#BFDBFE';
  if (count === 2) return '#60A5FA';
  return '#2563EB';
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function StreakCalendar({ mealDates }: StreakCalendarProps) {
  const today = new Date();
  const todayStr = formatDateKey(today);

  // Count meals per date
  const dateCounts: Record<string, number> = {};
  for (const d of mealDates) {
    dateCounts[d] = (dateCounts[d] ?? 0) + 1;
  }

  // Build last 35 days grid (7 cols × 5 rows), most recent last
  const days: { dateStr: string; count: number; isToday: boolean }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateKey(d);
    days.push({ dateStr, count: dateCounts[dateStr] ?? 0, isToday: dateStr === todayStr });
  }

  // Build 5 rows of 7
  const rows: typeof days[] = [];
  for (let r = 0; r < 5; r++) {
    rows.push(days.slice(r * 7, r * 7 + 7));
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>30-Day Activity</Text>
      </View>

      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((day) => (
              <View
                key={day.dateStr}
                style={[
                  styles.cell,
                  { backgroundColor: getCellColor(day.count) },
                  day.isToday && styles.cellToday,
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>Fewer</Text>
        <View style={styles.legend}>
          {[0, 1, 2, 3].map((level) => (
            <View
              key={level}
              style={[styles.legendCell, { backgroundColor: getCellColor(level) }]}
            />
          ))}
        </View>
        <Text style={styles.legendLabel}>More meals</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  legend: {
    flexDirection: 'row',
    gap: 4,
  },
  legendCell: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  grid: {
    gap: 3,
  },
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
    maxHeight: 20,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
});
