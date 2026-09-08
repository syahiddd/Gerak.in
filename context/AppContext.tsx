"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DAYS,
  todayDay,
  type WeeklyProgress,
  type Workout,
} from "@/lib/supabase/database.types";

type Summary = {
  workoutsCompleted: number;
  activeMinutes: number;
  totalReps: number;
};

type Favorite = {
  exercise_id: string;
  name: string;
  target: string | null;
  gif_url: string | null;
};

type AppContextValue = {
  loggedWorkouts: Workout[];
  weeklyProgress: { day: string; completed: boolean }[];
  summary: Summary;
  loading: boolean;
  logWorkout: (input: {
    exercise: string;
    sets: number | string;
    reps: number | string;
  }) => Promise<void>;
  DAYS: readonly string[];
  favorites: Favorite[];
  isFavorite: (exerciseId: string) => boolean;
  toggleFavorite: (input: {
    exercise_id: string;
    name: string;
    target?: string;
    gif_url?: string;
  }) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);
const hasEnv =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function calcSummary(workouts: Workout[]): Summary {
  const totalReps = workouts.reduce((s, w) => s + w.sets * w.reps, 0);
  return {
    workoutsCompleted: workouts.length,
    totalReps,
    activeMinutes: Math.round((totalReps * 3) / 60),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loggedWorkouts, setLoggedWorkouts] = useState<Workout[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState(
    DAYS.map((day) => ({ day, completed: false }))
  );
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!hasEnv) {
        setLoading(false);
        return; // Mode demo lokal tanpa Supabase.
      }
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const [{ data: workouts }, { data: progress }, { data: favs }] =
          await Promise.all([
          supabase
            .from("workouts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase.from("weekly_progress").select("*").eq("user_id", user.id),
          supabase
            .from("exercise_favorites")
            .select("exercise_id,name,target,gif_url")
            .eq("user_id", user.id)
            .limit(500),
        ]);
        if (workouts) setLoggedWorkouts(workouts as Workout[]);
        if (favs) setFavorites(favs as Favorite[]);
        if (progress) {
          const map = new Map(
            (progress as WeeklyProgress[]).map((p) => [p.day, p.completed])
          );
          setWeeklyProgress(DAYS.map((day) => ({ day, completed: !!map.get(day) })));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const logWorkout = useCallback(
    async ({
      exercise,
      sets,
      reps,
    }: {
      exercise: string;
      sets: number | string;
      reps: number | string;
    }) => {
      const s = Number(sets) || 0;
      const r = Number(reps) || 0;
      const today = todayDay();

      if (!hasEnv) {
        // Fallback demo: sama seperti AppContext Expo lama (in-memory).
        setLoggedWorkouts((prev) => [
          {
            id: Date.now().toString(),
            user_id: "demo",
            exercise,
            sets: s,
            reps: r,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setWeeklyProgress((prev) =>
          prev.map((d) => (d.day === today ? { ...d, completed: true } : d))
        );
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Belum login.");

      const { data, error } = await supabase
        .from("workouts")
        .insert({ user_id: user.id, exercise, sets: s, reps: r })
        .select()
        .single();
      if (error) throw error;

      setLoggedWorkouts((prev) => [data as Workout, ...prev]);
      setWeeklyProgress((prev) =>
        prev.map((d) => (d.day === today ? { ...d, completed: true } : d))
      );
      await supabase.from("weekly_progress").upsert(
        { user_id: user.id, day: today, completed: true },
        { onConflict: "user_id,day" }
      );
    },
    []
  );

  const summary = useMemo(() => calcSummary(loggedWorkouts), [loggedWorkouts]);

  const isFavorite = useCallback(
    (exerciseId: string) =>
      favorites.some((f) => f.exercise_id === exerciseId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async ({
      exercise_id,
      name,
      target,
      gif_url,
    }: {
      exercise_id: string;
      name: string;
      target?: string;
      gif_url?: string;
    }) => {
      const exists = favorites.some((f) => f.exercise_id === exercise_id);
      // Optimistic update agar UI terasa instan.
      setFavorites((prev) =>
        exists
          ? prev.filter((f) => f.exercise_id !== exercise_id)
          : [...prev, { exercise_id, name, target: target ?? null, gif_url: gif_url ?? null }]
      );
      if (!hasEnv) return; // Mode demo: cukup in-memory.
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return; // Belum login: biarkan favorit lokal saja.
        if (exists) {
          await supabase
            .from("exercise_favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("exercise_id", exercise_id);
        } else {
          await supabase.from("exercise_favorites").upsert(
            {
              user_id: user.id,
              exercise_id,
              name,
              target: target ?? null,
              gif_url: gif_url ?? null,
            },
            { onConflict: "user_id,exercise_id" }
          );
        }
      } catch {
        // Gagal sync: rollback sederhana dengan refetch pasif diabaikan.
      }
    },
    [favorites]
  );

  const value: AppContextValue = {
    loggedWorkouts,
    weeklyProgress,
    summary,
    loading,
    logWorkout,
    DAYS,
    favorites,
    isFavorite,
    toggleFavorite,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
};
