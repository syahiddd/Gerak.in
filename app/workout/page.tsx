"use client";

import { useEffect, useMemo, useState } from "react";
import ExerciseItem from "@/components/ExerciseItem";
import LogWorkoutForm from "@/components/LogWorkoutForm";
import RestTimer from "@/components/RestTimer";
import { useApp } from "@/context/AppContext";
import { searchExercises, sortByName } from "@/lib/exercisedb/search";
import {
  isFrontendCacheStale,
  readFrontendCache,
  writeFrontendCache,
  clearFrontendCache,
} from "@/lib/exercisedb/frontendCache";
import { FALLBACK_EXERCISES } from "@/lib/exercisedb/client";
import type { Exercise as ApiExercise } from "@/lib/exercisedb/types";

export default function WorkoutPage() {
  const { logWorkout, favorites, isFavorite, toggleFavorite } = useApp();
  const [catalog, setCatalog] = useState<ApiExercise[]>(() =>
    sortByName(FALLBACK_EXERCISES)
  );
  const [source, setSource] = useState<"supabase" | "oss" | "fallback" | "cache">(
    "fallback"
  );
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedId, setSelectedId] = useState("pushups");
  const [tab, setTab] = useState<"all" | "fav">("all");

  // Debounce 200ms agar binary search tidak jalan tiap keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  // L3 frontend cache: render instan dari localStorage, revalidate via /api.
  useEffect(() => {
    const local = readFrontendCache();
    if (local && local.length > 0) {
      setCatalog(sortByName(local));
      setSource("cache");
      if (!isFrontendCacheStale()) return; // Cache 7 hari masih fresh.
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/exercises", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        const data = sortByName(json.data ?? []);
        if (data.length > 0) {
          setCatalog(data);
          setSource(json.source ?? "oss");
          writeFrontendCache(data);
        }
      } catch {
        // Tetap pakai cache/fallback lokal.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(
    () => searchExercises(catalog, debounced, 50),
    [catalog, debounced]
  );

  const favList = useMemo(
    () =>
      favorites.map((f) => ({
        id: f.exercise_id,
        name: f.name,
        target: f.target ?? "General",
        gifUrl: f.gif_url ?? "",
        bodyPart: "",
      })),
    [favorites]
  );

  const visible = tab === "fav" ? favList : results;

  const selectedExercise =
    visible.find((e) => e.id === selectedId) ||
    results.find((e) => e.id === selectedId) ||
    catalog.find((e) => e.id === selectedId) || {
      id: selectedId,
      name: selectedId,
      target: "General",
      gifUrl: "",
      bodyPart: "",
    };

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-[28px] font-bold text-white">Workout</h1>
        <p className="mt-1 text-[15px] text-secondary">
          Pick an exercise and log your set.{" "}
          <span className="text-[12px] text-muted">
            Sumber: {source} • Data: ExerciseDB OSS (non-komersial)
          </span>
        </p>
      </header>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari workout… (mis. bench, squat)"
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-white placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          onClick={() => {
            clearFrontendCache();
            setQuery("");
            setTab("all");
          }}
          className="rounded-xl border border-border bg-surfaceAlt px-3 text-sm text-secondary hover:text-white"
        >
          Reset
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "fav"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t
                ? "bg-accent text-background"
                : "bg-surfaceAlt text-secondary"
            }`}
          >
            {t === "all" ? `Semua (${results.length})` : `Favorit (${favList.length})`}
          </button>
        ))}
      </div>

      <div className="my-4">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            {tab === "fav"
              ? "Belum ada favorit. Ketuk ikon hati untuk menyimpan."
              : `Tidak ketemu untuk "${debounced}". Coba prefix lain.`}
          </p>
        ) : (
          visible.slice(0, 30).map((ex) => (
            <ExerciseItem
              key={ex.id}
              exercise={{ id: ex.id, name: ex.name, target: ex.target, gifUrl: ex.gifUrl }}
              selected={ex.id === selectedId}
              isFavorite={isFavorite(ex.id)}
              onPress={() => setSelectedId(ex.id)}
              onToggleFavorite={() =>
                toggleFavorite({
                  exercise_id: ex.id,
                  name: ex.name,
                  target: ex.target,
                  gif_url: ex.gifUrl,
                })
              }
            />
          ))
        )}
      </div>

      <LogWorkoutForm
        exerciseName={selectedExercise.name}
        onSubmit={({ sets, reps }) =>
          logWorkout({ exercise: selectedExercise.name, sets, reps })
        }
      />
      <RestTimer />
    </main>
  );
}
