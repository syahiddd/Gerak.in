import { Clock, CheckCircle2 } from 'lucide-react';
import Card from './Card.jsx';
import styles from './SummaryCard.module.css';

/**
 * Today's summary widget for the Dashboard.
 * Receives metrics from AppContext via props.
 */
export default function SummaryCard({ activeMinutes, workoutsCompleted }) {
  return (
    <Card className={styles.wrapper}>
      <h2 className={`h3 ${styles.title}`}>Today's Summary</h2>
      <div className={styles.row}>
        <Stat icon={<Clock size={22} />} value={`${activeMinutes} min`} label="Active Time" />
        <div className={styles.divider} />
        <Stat icon={<CheckCircle2 size={22} />} value={String(workoutsCompleted)} label="Workouts" />
      </div>
    </Card>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
