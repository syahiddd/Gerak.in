import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import Card from './Card';
import { colors, radius, spacing, typography } from '../theme/colors';

/**
 * Sets/Reps logging form.
 * Calls `onSubmit({ sets, reps })` when the user taps "Log Workout".
 *
 * The form is intentionally dumb: parent owns the selected exercise
 * and what to do with the data. This keeps the component reusable.
 */
export default function LogWorkoutForm({ exerciseName, onSubmit }) {
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  const handleSubmit = () => {
    if (!sets || !reps) {
      Alert.alert('Missing info', 'Please enter both sets and reps.');
      return;
    }
    onSubmit({ sets, reps });
    setSets('');
    setReps('');
  };

  return (
    <Card>
      <Text style={styles.title}>Log Workout</Text>
      <Text style={styles.subtitle}>
        Logging for: <Text style={styles.exerciseName}>{exerciseName}</Text>
      </Text>

      <View style={styles.row}>
        <Field label="Sets" value={sets} onChange={setSets} />
        <View style={{ width: spacing.md }} />
        <Field label="Reps" value={reps} onChange={setReps} />
      </View>

      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.buttonText}>Log Workout</Text>
      </Pressable>
    </Card>
  );
}

function Field({ label, value, onChange }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  exerciseName: { color: colors.accent, fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
