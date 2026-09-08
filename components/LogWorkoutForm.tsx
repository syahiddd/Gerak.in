"use client";

import { useState } from "react";
import Card from "./Card";

export default function LogWorkoutForm({
  exerciseName,
  onSubmit,
}: {
  exerciseName: string;
  onSubmit: (input: { sets: string; reps: string }) => void | Promise<void>;
}) {
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!sets || !reps) {
      setError("Isi sets dan reps dulu.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSubmit({ sets, reps });
      setSets("");
      setReps("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan workout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h3 className="text-[18px] font-semibold text-white">Log Workout</h3>
      <p className="mb-4 mt-0.5 text-[15px] text-secondary">
        Logging for: <span className="font-semibold text-accent">{exerciseName}</span>
      </p>
      <div className="mb-4 flex gap-4">
        <label className="flex-1">
          <span className="mb-1 block text-[12px] font-medium uppercase tracking-[1px] text-secondary">
            Sets
          </span>
          <input
            value={sets}
            onChange={(e) => setSets(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder="0"
            className="w-full rounded-xl border border-border bg-surfaceAlt px-4 py-2.5 text-[16px] text-white placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-[12px] font-medium uppercase tracking-[1px] text-secondary">
            Reps
          </span>
          <input
            value={reps}
            onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder="0"
            className="w-full rounded-xl border border-border bg-surfaceAlt px-4 py-2.5 text-[16px] text-white placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full rounded-xl bg-accent py-3.5 text-[16px] font-bold tracking-wide text-background transition-opacity active:opacity-85 disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : "Log Workout"}
      </button>
    </Card>
  );
}
