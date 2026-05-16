import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, radius, spacing, typography } from '../theme/colors';

/**
 * Countdown rest timer.
 * - Default duration: 60s. User picks 30 / 60 / 90s presets.
 * - Start / Pause toggle, plus Reset.
 *
 * Implementation note: we use setInterval inside useRef so the timer
 * keeps running across re-renders. We always clear on unmount.
 */
const PRESETS = [30, 60, 90];

export default function RestTimer() {
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Sync remaining when user changes the preset (only if not running).
  useEffect(() => {
    if (!running) setRemaining(duration);
  }, [duration, running]);

  // Drive the countdown.
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const toggle = () => {
    if (remaining === 0) setRemaining(duration);
    setRunning((r) => !r);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(duration);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <Card>
      <Text style={styles.title}>Rest Timer</Text>

      <Text style={styles.time}>
        {mm}:{ss}
      </Text>

      {/* Preset chips */}
      <View style={styles.presetRow}>
        {PRESETS.map((sec) => {
          const active = duration === sec;
          return (
            <Pressable
              key={sec}
              onPress={() => setDuration(sec)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {sec}s
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Controls */}
      <View style={styles.controlRow}>
        <Pressable
          onPress={toggle}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons
            name={running ? 'pause' : 'play'}
            size={18}
            color={colors.background}
          />
          <Text style={styles.primaryBtnText}>
            {running ? 'Pause' : remaining === 0 ? 'Restart' : 'Start'}
          </Text>
        </Pressable>

        <Pressable
          onPress={reset}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="refresh" size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryBtnText}>Reset</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  time: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.accent,
    textAlign: 'center',
    marginVertical: spacing.md,
    letterSpacing: 2,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: { color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.background },
  controlRow: { flexDirection: 'row', gap: spacing.sm },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});
