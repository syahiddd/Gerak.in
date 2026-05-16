import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SummaryCard from '../components/SummaryCard';
import QuoteWidget from '../components/QuoteWidget';
import { colors, spacing, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function DashboardScreen() {
  const { summary } = useApp();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, Athlete</Text>
          <Text style={styles.subGreeting}>Let&apos;s move today.</Text>
        </View>

        <SummaryCard
          activeMinutes={summary.activeMinutes}
          workoutsCompleted={summary.workoutsCompleted}
        />

        <View style={{ height: spacing.md }} />

        <QuoteWidget />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  greeting: { ...typography.h1, color: colors.textPrimary },
  subGreeting: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
