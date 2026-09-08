import { Check } from "lucide-react";
import Card from "./Card";

export default function WeeklyTracker({
  weeklyProgress,
}: {
  weeklyProgress: { day: string; completed: boolean }[];
}) {
  const completedCount = weeklyProgress.filter((d) => d.completed).length;

  return (
    <Card>
      <div className="mb-4 flex items-end justify-between">
        <h3 className="text-[18px] font-semibold text-white">
          Weekly Consistency
        </h3>
        <p className="text-[20px] font-bold text-accent">
          {completedCount}/7{" "}
          <span className="text-[12px] font-medium text-secondary">days</span>
        </p>
      </div>
      <div className="mb-6 flex justify-between">
        {weeklyProgress.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center">
            <span
              className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border text-[12px] font-bold ${
                d.completed
                  ? "border-accent bg-accent text-background"
                  : "border-border bg-surfaceAlt text-muted"
              }`}
            >
              {d.completed ? <Check size={18} /> : d.day[0]}
            </span>
            <span className="mt-1 text-[11px] text-secondary">{d.day}</span>
          </div>
        ))}
      </div>
      <div className="flex h-16 items-end justify-between">
        {weeklyProgress.map((d) => (
          <div
            key={`bar-${d.day}`}
            className={`w-[22px] rounded-lg ${
              d.completed ? "bg-accent" : "bg-surfaceAlt"
            }`}
            style={{ height: d.completed ? 60 : 16 }}
          />
        ))}
      </div>
    </Card>
  );
}
