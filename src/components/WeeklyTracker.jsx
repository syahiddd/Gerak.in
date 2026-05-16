import { Check } from 'lucide-react';
import Card from './Card.jsx';
import styles from './WeeklyTracker.module.css';

/**
 * Weekly consistency tracker.
 * Renders Mon..Sun with a checkmark on completed days,
 * plus a simple bar chart for visual progress.
 */
export default function WeeklyTracker({ weeklyProgress }) {
  const completedCount = weeklyProgress.filter((d) => d.completed).length;

  return (
    <Card>
      <header className={styles.header}>
        <h3 className="h3">Weekly Consistency</h3>
        <p className={styles.count}>
          {completedCount}/7 <span className={styles.countLabel}>days</span>
        </p>
      </header>

      <div className={styles.daysRow}>
        {weeklyProgress.map((d) => (
          <div key={d.day} className={styles.dayCol}>
            <span className={`${styles.dayCircle} ${d.completed ? styles.dayCircleDone : ''}`}>
              {d.completed ? <Check size={18} /> : <span className={styles.dayDot}>{d.day[0]}</span>}
            </span>
            <span className={styles.dayLabel}>{d.day}</span>
          </div>
        ))}
      </div>

      {/* Simple bar chart: tall bar for completed days, short for empty. */}
      <div className={styles.barChart}>
        {weeklyProgress.map((d) => (
          <div
            key={`bar-${d.day}`}
            className={`${styles.bar} ${d.completed ? styles.barDone : styles.barEmpty}`}
            style={{ height: d.completed ? 60 : 16 }}
          />
        ))}
      </div>
    </Card>
  );
}
