import { useState } from 'react';
import { Target, Activity } from 'lucide-react';
import ExercisePicker from '../components/ExercisePicker.jsx';
import LogWorkoutForm from '../components/LogWorkoutForm.jsx';
import RestTimer from '../components/RestTimer.jsx';
import MuscleDiagram from '../components/MuscleDiagram.jsx';
import ExerciseAnimation from '../components/ExerciseAnimation.jsx';
import Card from '../components/Card.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getMusclesForExercise } from '../data/exercises.js';
import styles from './Screen.module.css';

/**
 * WorkoutScreen (Tab 2)
 * ─────────────────────
 * - Searchable exercise picker (120+ exercises)
 * - Muscle target diagram (highlights muscles for the selected exercise)
 * - Log Workout form: sets × reps × weight (kg)
 * - Rest timer with presets
 */
export default function WorkoutScreen() {
  const { logWorkout } = useApp();
  const [selected, setSelected] = useState(null); // full exercise object

  const handleSelect = (exercise) => setSelected(exercise);

  const handleSubmit = ({ sets, reps, weight }) => {
    if (!selected) return;
    logWorkout({
      exercise: selected.name,
      sets,
      reps,
      weight,
      muscles: getMusclesForExercise(selected),
    });
  };

  // Compute target muscles for the selected exercise (or empty array).
  const targetMuscles = selected ? getMusclesForExercise(selected) : [];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Workout</h1>
        <p className={styles.subtitle}>Pick an exercise and log your set.</p>
      </header>

      {/* Exercise picker */}
      <ExercisePicker
        selectedId={selected?.id || null}
        onSelect={handleSelect}
      />

      {/* Muscle target diagram + movement animation — appears once an exercise is selected */}
      {selected && (
        <>
          <div className={styles.spacer} />
          <Card>
            <div className={styles.muscleHeader}>
              <Activity size={18} className={styles.muscleHeaderIcon} />
              <h3 className="h3">Movement</h3>
              <span className={styles.muscleHeaderName}>{selected.name}</span>
            </div>
            <ExerciseAnimation exercise={selected} />
          </Card>

          <div className={styles.spacer} />

          <Card>
            <div className={styles.muscleHeader}>
              <Target size={18} className={styles.muscleHeaderIcon} />
              <h3 className="h3">Target Muscles</h3>
              <span className={styles.muscleHeaderName}>{selected.name}</span>
            </div>
            <MuscleDiagram active={targetMuscles} />
          </Card>
        </>
      )}

      <div className={styles.spacer} />

      {/* Log form — only rendered after picking an exercise */}
      {selected && (
        <LogWorkoutForm
          exerciseName={selected.name}
          exerciseEquipment={selected.equipment}
          onSubmit={handleSubmit}
        />
      )}

      <div className={styles.spacer} />

      <RestTimer />
    </div>
  );
}
