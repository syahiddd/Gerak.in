import { Trophy } from 'lucide-react';
import SummaryCard from '../components/SummaryCard.jsx';
import QuoteWidget from '../components/QuoteWidget.jsx';
import Card from '../components/Card.jsx';
import { useApp } from '../context/AppContext.jsx';
import styles from './Screen.module.css';
import dashStyles from './Dashboard.module.css';

export default function DashboardScreen() {
  const { summary, achievements } = useApp();

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

      <div className={styles.spacer} />

      {/* Achievements section */}
      <Card>
        <div className={dashStyles.achieveHeader}>
          <Trophy size={20} className={dashStyles.achieveIcon} />
          <h3 className="h3">Achievements</h3>
          <span className={dashStyles.achieveCount}>{achievements.length}</span>
        </div>

        {achievements.length === 0 ? (
          <p className={dashStyles.achieveEmpty}>
            Log your first workout to start unlocking achievements!
          </p>
        ) : (
          <ul className={dashStyles.achieveList}>
            {achievements.slice().reverse().slice(0, 6).map((a) => (
              <li key={a.id} className={dashStyles.achieveItem}>
                <span className={dashStyles.achieveEmoji}>{a.icon}</span>
                <div className={dashStyles.achieveBody}>
                  <span className={dashStyles.achieveTitle}>{a.title}</span>
                  <span className={dashStyles.achieveDesc}>{a.description}</span>
                </div>
                <time className={dashStyles.achieveTime}>
                  {new Date(a.unlockedAt).toLocaleTimeString([], {
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
