import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/**
 * AppContext
 * ----------
 * Holds session-only state shared across screens:
 *  - loggedWorkouts: list of completed workout entries
 *  - weeklyProgress: which days of the week have a workout (Mon..Sun)
 *  - achievements: unlocked milestones / notifications
 *
 * Achievement system:
 *  - Tracks streaks (consecutive days), total workouts, total reps, PRs.
 *  - Automatically checks milestones after each logged workout.
 *  - New achievements are queued for the toast notification component.
 */
const AppContext = createContext(null);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Map JS Date.getDay() (0=Sun..6=Sat) to our Mon-first index (0=Mon..6=Sun)
const todayIndex = () => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
};

// ─── Achievement definitions ───────────────────────────────────────────
// Each milestone: { id, title, description, condition(stats) }
const ACHIEVEMENT_DEFS = [
  // Workout count milestones
  { id: 'first-workout', title: 'First Rep!', description: 'You logged your first workout.', icon: '🎯', condition: (s) => s.totalWorkouts >= 1 },
  { id: '5-workouts', title: 'Getting Started', description: '5 workouts logged this session.', icon: '💪', condition: (s) => s.totalWorkouts >= 5 },
  { id: '10-workouts', title: 'Dedicated', description: '10 workouts logged. Keep pushing!', icon: '🔥', condition: (s) => s.totalWorkouts >= 10 },
  { id: '25-workouts', title: 'Quarter Century', description: '25 workouts logged!', icon: '⚡', condition: (s) => s.totalWorkouts >= 25 },
  { id: '50-workouts', title: 'Half Century', description: '50 workouts! You are unstoppable.', icon: '🏆', condition: (s) => s.totalWorkouts >= 50 },

  // Total reps milestones
  { id: '100-reps', title: 'Century Reps', description: 'Total 100 reps completed.', icon: '💯', condition: (s) => s.totalReps >= 100 },
  { id: '500-reps', title: 'Rep Machine', description: '500 total reps! Impressive.', icon: '🤖', condition: (s) => s.totalReps >= 500 },
  { id: '1000-reps', title: 'Thousand Club', description: '1,000 reps milestone reached!', icon: '👑', condition: (s) => s.totalReps >= 1000 },

  // Streak milestones (consecutive days with at least 1 workout)
  { id: 'streak-2', title: '2-Day Streak', description: 'Working out 2 days in a row!', icon: '🔥', condition: (s) => s.streak >= 2 },
  { id: 'streak-3', title: '3-Day Streak', description: 'Three consecutive training days!', icon: '🔥', condition: (s) => s.streak >= 3 },
  { id: 'streak-5', title: '5-Day Warrior', description: '5-day workout streak!', icon: '⚔️', condition: (s) => s.streak >= 5 },
  { id: 'streak-7', title: 'Perfect Week', description: 'Trained every day this week!', icon: '🌟', condition: (s) => s.streak >= 7 },

  // Variety milestones (unique exercises used)
  { id: '3-exercises', title: 'Mix It Up', description: 'Used 3 different exercises.', icon: '🎲', condition: (s) => s.uniqueExercises >= 3 },
  { id: '5-exercises', title: 'Explorer', description: 'Tried 5 different exercises.', icon: '🧭', condition: (s) => s.uniqueExercises >= 5 },
  { id: '10-exercises', title: 'Versatile Athlete', description: '10 unique exercises logged!', icon: '🏅', condition: (s) => s.uniqueExercises >= 10 },
  { id: '20-exercises', title: 'Gym Veteran', description: '20 unique exercises. True variety!', icon: '🎖️', condition: (s) => s.uniqueExercises >= 20 },

  // Volume PR (best single-set volume = sets * reps for one log)
  { id: 'volume-50', title: 'Volume Up', description: 'Single entry with 50+ total reps volume.', icon: '📈', condition: (s) => s.bestVolume >= 50 },
  { id: 'volume-100', title: 'High Volume', description: 'Single entry with 100+ reps volume!', icon: '🚀', condition: (s) => s.bestVolume >= 100 },

  // Weight / load PRs (single-rep weight)
  { id: 'weight-20', title: 'First Plates', description: 'Lifted 20kg in a single set.', icon: '🏋️', condition: (s) => s.heaviestLift >= 20 },
  { id: 'weight-50', title: '50kg Club', description: 'Lifted 50kg in a single set!', icon: '💪', condition: (s) => s.heaviestLift >= 50 },
  { id: 'weight-100', title: '100kg Club', description: 'Triple digits! Lifted 100kg.', icon: '🦾', condition: (s) => s.heaviestLift >= 100 },
  { id: 'weight-150', title: 'Heavy Hitter', description: 'Lifted 150kg in a single set!', icon: '⚡', condition: (s) => s.heaviestLift >= 150 },

  // Total tonnage (cumulative weight × reps × sets across all logs)
  { id: 'tonnage-1k', title: '1 Ton Lifted', description: 'Total tonnage reached 1,000 kg!', icon: '📦', condition: (s) => s.totalTonnage >= 1000 },
  { id: 'tonnage-5k', title: '5 Tons Lifted', description: 'Cumulative 5,000 kg moved!', icon: '🚚', condition: (s) => s.totalTonnage >= 5000 },
  { id: 'tonnage-10k', title: '10 Tons Lifted', description: 'Cumulative 10,000 kg moved!', icon: '🏗️', condition: (s) => s.totalTonnage >= 10000 },

  // Progress from previous day
  { id: 'beat-yesterday', title: 'Beat Yesterday', description: 'More reps today than yesterday!', icon: '📊', condition: (s) => s.beatYesterday },
  { id: 'heavier-than-yesterday', title: 'Going Heavier', description: 'Lifted heavier than yesterday!', icon: '📈', condition: (s) => s.heavierThanYesterday },
];

export function AppProvider({ children }) {
  const [loggedWorkouts, setLoggedWorkouts] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState(
    DAYS.map((day) => ({ day, completed: false }))
  );
  const [achievements, setAchievements] = useState([]); // { ...def, unlockedAt }
  const [toastQueue, setToastQueue] = useState([]);     // achievements waiting to be shown

  // Keep a ref of unlocked IDs for O(1) lookup during checks.
  const unlockedIdsRef = useRef(new Set());

  /**
   * Compute achievement stats from workouts list.
   * Called after each new log to check for new milestones.
   */
  const computeStats = useCallback((workouts) => {
    const totalWorkouts = workouts.length;
    const totalReps = workouts.reduce((sum, w) => sum + w.sets * w.reps, 0);
    const uniqueExercises = new Set(workouts.map((w) => w.exercise)).size;
    const bestVolume = workouts.reduce((max, w) => Math.max(max, w.sets * w.reps), 0);

    // Weight / load metrics
    const heaviestLift = workouts.reduce((max, w) => Math.max(max, w.weight || 0), 0);
    const totalTonnage = workouts.reduce(
      (sum, w) => sum + (w.weight || 0) * w.sets * w.reps,
      0
    );

    // Streak: count consecutive days (from today backward) with workouts.
    const today = todayIndex();
    let streak = 0;
    // Use weeklyProgress + the pending today to compute streak
    // Simpler approach: count backward in weeklyProgress from today
    // We'll compute from the updated progress (passed in or from state).
    // For now, we'll compute from the workouts' timestamps grouped by day.
    const daySet = new Set();
    workouts.forEach((w) => {
      const d = new Date(w.timestamp).getDay();
      daySet.add(d === 0 ? 6 : d - 1); // Mon-first index
    });
    for (let i = 0; i < 7; i++) {
      const checkIdx = (today - i + 7) % 7;
      if (daySet.has(checkIdx)) {
        streak++;
      } else {
        break;
      }
    }

    // Beat yesterday: compare today's total reps vs yesterday's.
    const yesterdayIdx = (today - 1 + 7) % 7;
    const dayFilter = (idx) => (w) => {
      const d = new Date(w.timestamp).getDay();
      return (d === 0 ? 6 : d - 1) === idx;
    };
    const todayWorkouts = workouts.filter(dayFilter(today));
    const yesterdayWorkouts = workouts.filter(dayFilter(yesterdayIdx));

    const todayReps = todayWorkouts.reduce((sum, w) => sum + w.sets * w.reps, 0);
    const yesterdayReps = yesterdayWorkouts.reduce((sum, w) => sum + w.sets * w.reps, 0);
    const beatYesterday = yesterdayReps > 0 && todayReps > yesterdayReps;

    // Heavier than yesterday: compare max weight lifted today vs yesterday
    const todayMaxWeight = todayWorkouts.reduce((m, w) => Math.max(m, w.weight || 0), 0);
    const yesterdayMaxWeight = yesterdayWorkouts.reduce((m, w) => Math.max(m, w.weight || 0), 0);
    const heavierThanYesterday = yesterdayMaxWeight > 0 && todayMaxWeight > yesterdayMaxWeight;

    return {
      totalWorkouts, totalReps, uniqueExercises, bestVolume, streak,
      beatYesterday, heaviestLift, totalTonnage, heavierThanYesterday,
    };
  }, []);

  /**
   * Check and unlock any newly-achieved milestones.
   * Returns the list of newly unlocked achievements.
   */
  const checkAchievements = useCallback((workouts) => {
    const stats = computeStats(workouts);
    const newlyUnlocked = [];

    for (const def of ACHIEVEMENT_DEFS) {
      if (unlockedIdsRef.current.has(def.id)) continue; // already unlocked
      if (def.condition(stats)) {
        const achievement = { ...def, unlockedAt: new Date().toISOString() };
        newlyUnlocked.push(achievement);
        unlockedIdsRef.current.add(def.id);
      }
    }

    if (newlyUnlocked.length > 0) {
      setAchievements((prev) => [...prev, ...newlyUnlocked]);
      setToastQueue((prev) => [...prev, ...newlyUnlocked]);
    }

    return newlyUnlocked;
  }, [computeStats]);

  // Add a workout entry, mark today, and check achievements.
  const logWorkout = ({ exercise, sets, reps, weight = 0, muscles = [] }) => {
    const entry = {
      id: Date.now().toString(),
      exercise,
      sets: Number(sets) || 0,
      reps: Number(reps) || 0,
      weight: Number(weight) || 0,
      muscles,
      timestamp: new Date().toISOString(),
    };

    setLoggedWorkouts((prev) => {
      const updated = [entry, ...prev];
      // Defer achievement check to after state update.
      setTimeout(() => checkAchievements(updated), 0);
      return updated;
    });

    const idx = todayIndex();
    setWeeklyProgress((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, completed: true } : d))
    );
  };

  // Dismiss the front toast from the queue.
  const dismissToast = useCallback(() => {
    setToastQueue((prev) => prev.slice(1));
  }, []);

  // Derived metrics for the dashboard summary card.
  const summary = useMemo(() => {
    const totalReps = loggedWorkouts.reduce(
      (sum, w) => sum + w.sets * w.reps,
      0
    );
    const activeMinutes = Math.round((totalReps * 3) / 60); // ~3s per rep
    const totalTonnage = loggedWorkouts.reduce(
      (sum, w) => sum + (w.weight || 0) * w.sets * w.reps,
      0
    );
    const heaviestLift = loggedWorkouts.reduce(
      (max, w) => Math.max(max, w.weight || 0),
      0
    );
    return {
      workoutsCompleted: loggedWorkouts.length,
      activeMinutes,
      totalReps,
      totalTonnage,
      heaviestLift,
    };
  }, [loggedWorkouts]);

  return (
    <AppContext.Provider
      value={{
        loggedWorkouts,
        weeklyProgress,
        summary,
        logWorkout,
        DAYS,
        // Achievement system
        achievements,
        toastQueue,
        dismissToast,
      }}
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
