import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';

/**
 * A single row in the exercise list.
 * Highlights when selected so the user knows which exercise the
 * "Log Workout" form is targeting.
 */
export default function ExerciseItem({ exercise, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={exercise.icon}
          size={22}
          color={selected ? colors.background : colors.accent}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.target}>{exercise.target}</Text>
      </View>

      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? colors.accent : colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapSelected: { backgroundColor: colors.accent },
  name: { ...typography.h3, color: colors.textPrimary },
  target: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
