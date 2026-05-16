import { useState } from 'react';
import Card from './Card.jsx';
import styles from './LogWorkoutForm.module.css';

/**
 * Log Workout form
 * ────────────────
 * Inputs: Sets, Reps, Weight (kg).
 * Weight is optional — bodyweight exercises can leave it blank or 0.
 *
 * Calls `onSubmit({ sets, reps, weight })` on submit.
 */
export default function LogWorkoutForm({ exerciseName, exerciseEquipment, onSubmit }) {
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  // Bodyweight / cardio exercises can be logged without a weight.
  const isBodyweight = exerciseEquipment === 'Bodyweight';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sets || !reps) {
      alert('Please enter both sets and reps.');
      return;
    }
    onSubmit({ sets, reps, weight: weight || '0' });
    setSets('');
    setReps('');
    setWeight('');
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

        {/* Weight input (kg). Hint differs for bodyweight exercises. */}
        <div className={styles.weightRow}>
          <Field
            label={`Weight (kg)${isBodyweight ? ' — optional' : ''}`}
            value={weight}
            onChange={setWeight}
            placeholder={isBodyweight ? '0 (bodyweight)' : '0'}
            allowDecimal
          />
        </div>

        <button type="submit" className={styles.button}>Log Workout</button>
      </form>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder = '0', allowDecimal = false }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        type="number"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        step={allowDecimal ? '0.5' : '1'}
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
    </label>
  );
}
