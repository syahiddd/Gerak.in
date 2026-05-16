import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WeeklyTracker from '../components/WeeklyTracker';
import Card from '../components/Card';
import { colors, spacing, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function ProgressScreen() {
  const { weeklyProgress, loggedWorkouts } = useApp();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Your weekly snapshot.</Text>

        <View style={{ height: spacing.md }} />

        <WeeklyTracker weeklyProgress={weeklyProgress} />

        <View style={{ height: spacing.md }} />

        {/* Recent activity feed */}
        <Card>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {loggedWorkouts.length === 0 ? (
            <Text style={styles.empty}>
              No workouts logged yet. Head to the Workout tab to get started.
            </Text>
          ) : (
            loggedWorkouts.slice(0, 5).map((w) => (
              <View key={w.id} style={styles.activityRow}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityName}>{w.exercise}</Text>
                  <Text style={styles.activityMeta}>
                    {w.sets} sets x {w.reps} reps
                  </Text>
                </View>
                <Text style={styles.activityTime}>
                  {new Date(w.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  activityName: { color: colors.textPrimary, fontWeight: '600' },
  activityMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  activityTime: { color: colors.textMuted, fontSize: 12 },
});
