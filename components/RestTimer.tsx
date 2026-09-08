"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import Card from "./Card";

const PRESETS = [30, 60, 90];

export default function RestTimer() {
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) setRemaining(duration);
  }, [duration, running]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const toggle = () => {
    if (remaining === 0) setRemaining(duration);
    setRunning((r) => !r);
  };
  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(duration);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <Card>
      <h3 className="mb-2 text-[18px] font-semibold text-white">Rest Timer</h3>
      <p className="my-4 text-center text-[56px] font-extrabold tracking-[2px] text-accent">
        {mm}:{ss}
      </p>
      <div className="mb-4 flex justify-center gap-2">
        {PRESETS.map((sec) => {
          const active = duration === sec;
          return (
            <button
              key={sec}
              onClick={() => setDuration(sec)}
              className={`rounded-full border px-4 py-1.5 font-semibold ${
                active
                  ? "border-accent bg-accent text-background"
                  : "border-border bg-surfaceAlt text-secondary hover:text-white"
              }`}
            >
              {sec}s
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          onClick={toggle}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-3 text-[16px] font-bold text-background active:opacity-85"
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? "Pause" : remaining === 0 ? "Restart" : "Start"}
        </button>
        <button
          onClick={reset}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surfaceAlt py-3 text-[16px] font-semibold text-white active:opacity-85"
        >
          <RotateCcw size={18} />
          Reset
        </button>
      </div>
    </Card>
  );
}
