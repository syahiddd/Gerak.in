import { useState } from 'react';
import { Flame, Activity, User } from 'lucide-react';
import ExerciseItem from '../components/ExerciseItem.jsx';
import LogWorkoutForm from '../components/LogWorkoutForm.jsx';
import RestTimer from '../components/RestTimer.jsx';
import { useApp } from '../context/AppContext.jsx';
import styles from './Screen.module.css';

// Master list of exercises shown in the workout tab.
// Icons come from lucide-react.
const EXERCISES = [
  { id: 'pushups', name: 'Push-ups', target: 'Chest \u2022 Triceps', icon: Flame },
  { id: 'squats',  name: 'Squats',   target: 'Legs \u2022 Glutes',   icon: Activity },
  { id: 'planks',  name: 'Planks',   target: 'Core',                 icon: User },
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
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Workout</h1>
        <p className={styles.subtitle}>Pick an exercise and log your set.</p>
      </header>

      <div className={styles.list}>
        {EXERCISES.map((ex) => (
          <ExerciseItem
            key={ex.id}
            exercise={ex}
            selected={ex.id === selectedId}
            onClick={() => setSelectedId(ex.id)}
          />
        ))}
      </div>

      <LogWorkoutForm
        exerciseName={selectedExercise.name}
        onSubmit={handleSubmit}
      />

      <div className={styles.spacer} />

      <RestTimer />
    </div>
  );
}
