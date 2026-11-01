import { humanDuration } from '@/Components/social/format';
import { formatNumber, kgToUnit, useUnitSystem, weightUnit } from '@/lib/units';
import { Workout } from '@/types';
import { Link } from '@inertiajs/react';

/** One finished workout as a training-log line; used by History and the Profile page. */
export default function WorkoutRow({ workout: w }: { workout: Workout }) {
    const date = new Date(w.started_at);
    const system = useUnitSystem();

    return (
        <Link
            href={route('workouts.show', w.id)}
            className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900 dark:focus-visible:ring-lime-400 dark:hover:bg-zinc-800/60"
        >
            {/* The day is what people scan for in a training log. */}
            <div className="w-11 shrink-0 text-center">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p className="text-xl font-extrabold leading-tight tabular-nums">{date.getDate()}</p>
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{w.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {w.exercises_count} {w.exercises_count === 1 ? 'exercise' : 'exercises'} · {humanDuration(w.duration_seconds)}
                </p>
            </div>
            <p className="shrink-0 text-right font-bold tabular-nums">
                {formatNumber(kgToUnit(w.total_volume_kg, system))} <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{weightUnit(system)}</span>
            </p>
        </Link>
    );
}
