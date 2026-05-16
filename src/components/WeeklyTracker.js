import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, radius, spacing, typography } from '../theme/colors';

/**
 * Weekly consistency tracker.
 * Renders Mon..Sun with a checkmark on completed days,
 * plus a simple bar chart for visual progress.
 */
export default function WeeklyTracker({ weeklyProgress }) {
  const completedCount = weeklyProgress.filter((d) => d.completed).length;

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Consistency</Text>
        <Text style={styles.count}>
          {completedCount}/7 <Text style={styles.countLabel}>days</Text>
        </Text>
      </View>

      {/* Day check row */}
      <View style={styles.daysRow}>
        {weeklyProgress.map((d) => (
          <View key={d.day} style={styles.dayCol}>
            <View
              style={[
                styles.dayCircle,
                d.completed && styles.dayCircleDone,
              ]}
            >
              {d.completed ? (
                <Ionicons name="checkmark" size={18} color={colors.background} />
              ) : (
                <Text style={styles.dayDot}>{d.day[0]}</Text>
              )}
            </View>
            <Text style={styles.dayLabel}>{d.day}</Text>
          </View>
        ))}
      </View>

      {/* Bar chart placeholder (height varies by completed flag) */}
      <View style={styles.barChart}>
        {weeklyProgress.map((d) => (
          <View
            key={`bar-${d.day}`}
            style={[
              styles.bar,
              { height: d.completed ? 60 : 16 },
              d.completed ? styles.barDone : styles.barEmpty,
            ]}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  count: { color: colors.accent, fontSize: 20, fontWeight: '700' },
  countLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },

  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  dayCol: { alignItems: 'center', flex: 1 },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCircleDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayDot: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  dayLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs,
  },

  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 64,
  },
  bar: { width: 22, borderRadius: radius.sm },
  barDone: { backgroundColor: colors.accent },
  barEmpty: { backgroundColor: colors.surfaceAlt },
});
