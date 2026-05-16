import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import Card from './Card.jsx';
import styles from './RestTimer.module.css';

/**
 * Countdown rest timer.
 * - Default duration: 60s. User picks 30 / 60 / 90s presets.
 * - Start / Pause toggle, plus Reset.
 *
 * Implementation note: setInterval inside useRef so the timer keeps
 * running across re-renders. We always clear on unmount.
 */
const PRESETS = [30, 60, 90];

export default function RestTimer() {
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Sync remaining when user changes the preset (only if not running).
  useEffect(() => {
    if (!running) setRemaining(duration);
  }, [duration, running]);

  // Drive the countdown.
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          // Soft beep feedback when timer finishes (best-effort, non-blocking).
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.frequency.value = 880;
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          } catch { /* ignore */ }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const toggle = () => {
    if (remaining === 0) setRemaining(duration);
    setRunning((r) => !r);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(duration);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <Card>
      <h3 className="h3">Rest Timer</h3>
      <div className={styles.time}>{mm}:{ss}</div>

      <div className={styles.presetRow}>
        {PRESETS.map((sec) => {
          const active = duration === sec;
          return (
            <button
              key={sec}
              type="button"
              onClick={() => setDuration(sec)}
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
            >
              {sec}s
            </button>
          );
        })}
      </div>

      <div className={styles.controlRow}>
        <button type="button" onClick={toggle} className={styles.primaryBtn}>
          {running ? <Pause size={18} /> : <Play size={18} />}
          <span>{running ? 'Pause' : remaining === 0 ? 'Restart' : 'Start'}</span>
        </button>
        <button type="button" onClick={reset} className={styles.secondaryBtn}>
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </div>
    </Card>
  );
}
