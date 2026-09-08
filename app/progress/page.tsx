"use client";

import Card from "@/components/Card";
import WeeklyTracker from "@/components/WeeklyTracker";
import { useApp } from "@/context/AppContext";

export default function ProgressPage() {
  const { weeklyProgress, loggedWorkouts, loading } = useApp();

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-[28px] font-bold text-white">Progress</h1>
        <p className="mt-1 text-[15px] text-secondary">Your weekly snapshot.</p>
      </header>

      <WeeklyTracker weeklyProgress={weeklyProgress} />

      <Card>
        <h3 className="mb-2 text-[18px] font-semibold text-white">
          Recent Activity
        </h3>
        {loading ? (
          <p className="py-2 text-[15px] text-muted">Memuat...</p>
        ) : loggedWorkouts.length === 0 ? (
          <p className="py-2 text-[15px] text-muted">
            No workouts logged yet. Head to the Workout tab to get started.
          </p>
        ) : (
          loggedWorkouts.slice(0, 5).map((w) => (
            <div
              key={w.id}
              className="flex items-center border-t border-border py-2 first:border-t-0"
            >
              <span className="mr-2 h-2 w-2 rounded-full bg-accent" />
              <div className="flex-1">
                <p className="font-semibold text-white">{w.exercise}</p>
                <p className="mt-0.5 text-[12px] text-secondary">
                  {w.sets} sets x {w.reps} reps
                </p>
              </div>
              <span className="text-[12px] text-muted">
                {new Date(w.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
      </Card>
    </main>
  );
}
