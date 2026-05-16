import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import Card from './Card';
import { colors, spacing, typography } from '../theme/colors';

// Small built-in quote pool. Add more or fetch from an API later.
const QUOTES = [
  'Push yourself, because no one else is going to do it for you.',
  'The body achieves what the mind believes.',
  'Sweat is just fat crying.',
  'Small steps every day.',
  'Discipline > motivation.',
  'You don\u2019t have to be extreme, just consistent.',
  'Your only competition is who you were yesterday.',
];

/**
 * Picks a quote based on the day of the year so it stays
 * stable for a whole day but rotates daily.
 */
export default function QuoteWidget() {
  const quote = useMemo(() => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = new Date() - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>Daily Motivation</Text>
      <Text style={styles.quote}>&ldquo;{quote}&rdquo;</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  label: {
    ...typography.caption,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  quote: {
    ...typography.body,
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
