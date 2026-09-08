export type Workout = {
  id: string;
  user_id: string;
  exercise: string;
  sets: number;
  reps: number;
  created_at: string;
};

export type WeeklyProgress = {
  user_id: string;
  day: string;
  completed: boolean;
  updated_at: string;
};

export type Quote = {
  id: number;
  text: string;
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

/** Index Mon-first (0=Mon..6=Sun) dari Date JS. */
export function todayDay(): Day {
  const d = new Date().getDay();
  const idx = d === 0 ? 6 : d - 1;
  return DAYS[idx];
}
