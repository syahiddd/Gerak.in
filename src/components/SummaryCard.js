import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, spacing, typography } from '../theme/colors';

/**
 * Today's summary widget for the Dashboard.
 * Receives metrics from AppContext via props.
 */
export default function SummaryCard({ activeMinutes, workoutsCompleted }) {
  return (
    <Card style={styles.wrapper}>
      <Text style={styles.title}>Today&apos;s Summary</Text>

      <View style={styles.row}>
        <Stat
          icon="time-outline"
          value={`${activeMinutes} min`}
          label="Active Time"
        />
        <View style={styles.divider} />
        <Stat
          icon="checkmark-done-outline"
          value={String(workoutsCompleted)}
          label="Workouts"
        />
      </View>
    </Card>
  );
}

function Stat({ icon, value, label }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={22} color={colors.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingVertical: spacing.lg },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: colors.border,
  },
});
