import SummaryCard from '../components/SummaryCard.jsx';
import QuoteWidget from '../components/QuoteWidget.jsx';
import { useApp } from '../context/AppContext.jsx';
import styles from './Screen.module.css';

export default function DashboardScreen() {
  const { summary } = useApp();

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Hello, Athlete</h1>
        <p className={styles.subtitle}>Let's move today.</p>
      </header>

      <SummaryCard
        activeMinutes={summary.activeMinutes}
        workoutsCompleted={summary.workoutsCompleted}
      />

      <div className={styles.spacer} />

      <QuoteWidget />
    </div>
  );
}
