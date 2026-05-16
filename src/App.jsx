import { useState } from 'react';
import { Home, Dumbbell, BarChart3 } from 'lucide-react';
import DashboardScreen from './screens/DashboardScreen.jsx';
import WorkoutScreen from './screens/WorkoutScreen.jsx';
import ProgressScreen from './screens/ProgressScreen.jsx';
import styles from './App.module.css';

/**
 * App shell.
 * Bottom tab bar acts as our "router" -- swaps which screen is rendered.
 * Lightweight enough that we don't need react-router for an MVP.
 */
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home,       Component: DashboardScreen },
  { id: 'workout',   label: 'Workout',   icon: Dumbbell,   Component: WorkoutScreen   },
  { id: 'progress',  label: 'Progress',  icon: BarChart3,  Component: ProgressScreen  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const Active = TABS.find((t) => t.id === activeTab).Component;

  return (
    <div className="app-shell">
      <main className="app-content">
        <Active />
      </main>

      <nav className={styles.tabBar} aria-label="Primary">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
