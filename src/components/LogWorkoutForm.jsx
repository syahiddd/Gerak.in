import { useState } from 'react';
import Card from './Card.jsx';
import styles from './LogWorkoutForm.module.css';

/**
 * Sets/Reps logging form.
 * Calls `onSubmit({ sets, reps })` when the user submits.
 *
 * Intentionally dumb: parent owns the selected exercise and decides
 * what to do with the data. Keeps the component reusable.
 */
export default function LogWorkoutForm({ exerciseName, onSubmit }) {
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sets || !reps) {
      alert('Please enter both sets and reps.');
      return;
    }
    onSubmit({ sets, reps });
    setSets('');
    setReps('');
  };

  return (
    <Card>
      <h3 className="h3">Log Workout</h3>
      <p className={styles.subtitle}>
        Logging for: <span className={styles.exerciseName}>{exerciseName}</span>
      </p>

      <form onSubmit={handleSubmit}>
        <div className={styles.row}>
          <Field label="Sets" value={sets} onChange={setSets} />
          <Field label="Reps" value={reps} onChange={setReps} />
        </div>
        <button type="submit" className={styles.button}>Log Workout</button>
      </form>
    </Card>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={styles.input}
      />
    </label>
  );
}
