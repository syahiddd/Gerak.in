import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExerciseItem from '../components/ExerciseItem';
import LogWorkoutForm from '../components/LogWorkoutForm';
import RestTimer from '../components/RestTimer';
import { colors, spacing, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

// Master list of exercises shown in the workout tab.
// Icons come from @expo/vector-icons (Ionicons).
const EXERCISES = [
  { id: 'pushups', name: 'Push-ups',  target: 'Chest \u2022 Triceps', icon: 'fitness-outline' },
  { id: 'squats',  name: 'Squats',    target: 'Legs \u2022 Glutes',   icon: 'walk-outline' },
  { id: 'planks',  name: 'Planks',    target: 'Core',                 icon: 'body-outline' },
];

export default function WorkoutScreen() {
  const { logWorkout } = useApp();
  const [selectedId, setSelectedId] = useState(EXERCISES[0].id);

  const selectedExercise =
    EXERCISES.find((e) => e.id === selectedId) || EXERCISES[0];

  const handleSubmit = ({ sets, reps }) => {
    logWorkout({ exercise: selectedExercise.name, sets, reps });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Workout</Text>
        <Text style={styles.subtitle}>Pick an exercise and log your set.</Text>

        {/* Exercise list */}
        <View style={{ marginTop: spacing.md, marginBottom: spacing.md }}>
          {EXERCISES.map((ex) => (
            <ExerciseItem
              key={ex.id}
              exercise={ex}
              selected={ex.id === selectedId}
              onPress={() => setSelectedId(ex.id)}
            />
          ))}
        </View>

        <LogWorkoutForm
          exerciseName={selectedExercise.name}
          onSubmit={handleSubmit}
        />

        <View style={{ height: spacing.md }} />

        <RestTimer />
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
});
