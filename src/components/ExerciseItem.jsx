import { Circle, CheckCircle2 } from 'lucide-react';
import styles from './ExerciseItem.module.css';

/**
 * A single row in the exercise list.
 * Highlights when selected so the user knows which exercise the
 * "Log Workout" form is targeting.
 */
export default function ExerciseItem({ exercise, selected, onClick }) {
  const Icon = exercise.icon;
  const cls = [styles.row, selected && styles.rowSelected].filter(Boolean).join(' ');

  return (
    <button type="button" onClick={onClick} className={cls}>
      <span className={`${styles.iconWrap} ${selected ? styles.iconWrapSelected : ''}`}>
        <Icon size={22} />
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{exercise.name}</span>
        <span className={styles.target}>{exercise.target}</span>
      </span>
      {selected
        ? <CheckCircle2 size={20} className={styles.radioOn} />
        : <Circle size={20} className={styles.radioOff} />}
    </button>
  );
}
