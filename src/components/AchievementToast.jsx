import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import styles from './AchievementToast.module.css';

/**
 * AchievementToast
 * ────────────────
 * Animated popup that appears at the top of the screen when the user
 * unlocks a new achievement. Auto-dismisses after 4 seconds or can be
 * tapped/clicked to dismiss early.
 *
 * Reads from `toastQueue` in AppContext and pops one at a time.
 */
const AUTO_DISMISS_MS = 4000;

export default function AchievementToast() {
  const { toastQueue, dismissToast } = useApp();
  const [exiting, setExiting] = useState(false);

  const current = toastQueue[0] || null;

  // Auto-dismiss timer.
  useEffect(() => {
    if (!current) return;
    setExiting(false);
    const timer = setTimeout(() => handleDismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [current]);

  const handleDismiss = () => {
    setExiting(true);
    // Wait for exit animation to finish before removing from queue.
    setTimeout(() => {
      setExiting(false);
      dismissToast();
    }, 300);
  };

  if (!current) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.toast} ${exiting ? styles.toastExiting : ''}`}
        onClick={handleDismiss}
        role="alert"
        aria-live="polite"
      >
        <span className={styles.icon}>{current.icon}</span>
        <div className={styles.body}>
          <span className={styles.label}>Achievement Unlocked</span>
          <span className={styles.title}>{current.title}</span>
          <span className={styles.description}>{current.description}</span>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
