import { useState } from 'react';
import ExercisePicker from '../components/ExercisePicker.jsx';
import LogWorkoutForm from '../components/LogWorkoutForm.jsx';
import RestTimer from '../components/RestTimer.jsx';
import { useApp } from '../context/AppContext.jsx';
import styles from './Screen.module.css';

/**
 * WorkoutScreen (Tab 2)
 * ─────────────────────
 * - Searchable exercise picker with 120+ exercises
 * - Log Workout form (sets × reps)
 * - Rest timer with presets
 */
export default function WorkoutScreen() {
  const { logWorkout } = useApp();
  const [selected, setSelected] = useState(null); // full exercise object

  const handleSelect = (exercise) => {
    setSelected(exercise);
  };

  const handleSubmit = ({ sets, reps }) => {
    if (!selected) return;
    logWorkout({ exercise: selected.name, sets, reps });
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Workout</h1>
        <p className={styles.subtitle}>Pick an exercise and log your set.</p>
      </header>

      {/* Searchable exercise picker (120+ exercises) */}
      <ExercisePicker
        selectedId={selected?.id || null}
        onSelect={handleSelect}
      />

      <div className={styles.spacer} />

      {/* Log form — only shown after selecting an exercise */}
      {selected && (
        <LogWorkoutForm
          exerciseName={selected.name}
          onSubmit={handleSubmit}
        />
      )}

      <div className={styles.spacer} />

      <RestTimer />
    </div>
  );
}
