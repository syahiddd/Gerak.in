import { Clock, CheckCircle2, Dumbbell } from 'lucide-react';
import Card from './Card.jsx';
import styles from './SummaryCard.module.css';

/**
 * Today's summary widget for the Dashboard.
 * Shows Active Time, Workouts, and Total Tonnage (kg) lifted.
 */
export default function SummaryCard({ activeMinutes, workoutsCompleted, totalTonnage = 0 }) {
  // Format tonnage: show kg under 1000, "X.X t" above (tons).
  const tonnageDisplay = totalTonnage >= 1000
    ? `${(totalTonnage / 1000).toFixed(1)} t`
    : `${Math.round(totalTonnage)} kg`;

  return (
    <Card className={styles.wrapper}>
      <h2 className={`h3 ${styles.title}`}>Today's Summary</h2>
      <div className={styles.row}>
        <Stat icon={<Clock size={22} />}        value={`${activeMinutes} min`}      label="Active Time" />
        <div className={styles.divider} />
        <Stat icon={<CheckCircle2 size={22} />} value={String(workoutsCompleted)}   label="Workouts" />
        <div className={styles.divider} />
        <Stat icon={<Dumbbell size={22} />}     value={tonnageDisplay}              label="Tonnage" />
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
