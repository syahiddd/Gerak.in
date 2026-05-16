import { createContext, useContext, useMemo, useState } from 'react';

/**
 * AppContext
 * ----------
 * Holds session-only state shared across screens:
 *  - loggedWorkouts: list of completed workout entries
 *  - weeklyProgress: which days of the week have a workout (Mon..Sun)
 *
 * To persist across reloads later, swap useState for a hook
 * that reads/writes localStorage.
 */
const AppContext = createContext(null);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Map JS Date.getDay() (0=Sun..6=Sat) to our Mon-first index (0=Mon..6=Sun)
const todayIndex = () => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
};

export function AppProvider({ children }) {
  const [loggedWorkouts, setLoggedWorkouts] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState(
    DAYS.map((day) => ({ day, completed: false }))
  );

  // Add a workout entry and mark today as completed in the weekly tracker.
  const logWorkout = ({ exercise, sets, reps }) => {
    const entry = {
      id: Date.now().toString(),
      exercise,
      sets: Number(sets) || 0,
      reps: Number(reps) || 0,
      timestamp: new Date().toISOString(),
    };
    setLoggedWorkouts((prev) => [entry, ...prev]);

    const idx = todayIndex();
    setWeeklyProgress((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, completed: true } : d))
    );
  };

  // Derived metrics for the dashboard summary card.
  const summary = useMemo(() => {
    const totalReps = loggedWorkouts.reduce(
      (sum, w) => sum + w.sets * w.reps,
      0
    );
    const activeMinutes = Math.round((totalReps * 3) / 60); // ~3s per rep
    return {
      workoutsCompleted: loggedWorkouts.length,
      activeMinutes,
      totalReps,
    };
  }, [loggedWorkouts]);

  return (
    <AppContext.Provider
      value={{ loggedWorkouts, weeklyProgress, summary, logWorkout, DAYS }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};
