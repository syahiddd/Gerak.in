import WeeklyTracker from '../components/WeeklyTracker.jsx';
import Card from '../components/Card.jsx';
import { useApp } from '../context/AppContext.jsx';
import styles from './Screen.module.css';

export default function ProgressScreen() {
  const { weeklyProgress, loggedWorkouts } = useApp();

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Progress</h1>
        <p className={styles.subtitle}>Your weekly snapshot.</p>
      </header>

      <WeeklyTracker weeklyProgress={weeklyProgress} />

      <div className={styles.spacer} />

      <Card>
        <h3 className="h3" style={{ marginBottom: 'var(--sp-sm)' }}>Recent Activity</h3>
        {loggedWorkouts.length === 0 ? (
          <p className={styles.empty}>
            No workouts logged yet. Head to the Workout tab to get started.
          </p>
        ) : (
          <ul>
            {loggedWorkouts.slice(0, 5).map((w) => (
              <li key={w.id} className={styles.activityRow}>
                <span className={styles.dot} />
                <div className={styles.activityBody}>
                  <span className={styles.activityName}>{w.exercise}</span>
                  <span className={styles.activityMeta}>
                    {w.sets} sets &times; {w.reps} reps
                    {w.weight > 0 && <> &times; <strong style={{ color: 'var(--accent)' }}>{w.weight}kg</strong></>}
                  </span>
                </div>
                <time className={styles.activityTime}>
                  {new Date(w.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
