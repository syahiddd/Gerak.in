import { BadgeCheck, Timer } from "lucide-react";
import Card from "./Card";

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="text-accent">{icon}</span>
      <p className="mt-1 text-[22px] font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[12px] font-medium uppercase tracking-[1px] text-secondary">
        {label}
      </p>
    </div>
  );
}

export default function SummaryCard({
  activeMinutes,
  workoutsCompleted,
}: {
  activeMinutes: number;
  workoutsCompleted: number;
}) {
  return (
    <Card className="py-6">
      <h3 className="mb-4 text-[18px] font-semibold text-white">
        Today&apos;s Summary
      </h3>
      <div className="flex items-center">
        <Stat
          icon={<Timer size={22} />}
          value={`${activeMinutes} min`}
          label="Active Time"
        />
        <div className="h-12 w-px bg-border" />
        <Stat
          icon={<BadgeCheck size={22} />}
          value={String(workoutsCompleted)}
          label="Workouts"
        />
      </div>
    </Card>
  );
}
