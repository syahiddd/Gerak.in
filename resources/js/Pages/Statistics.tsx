import { Card, MuscleBars } from '@/Components/ui';
import VolumeChart, { formatPeriod } from '@/Components/VolumeChart';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatNumber } from '@/lib/units';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Dumbbell, Flame, Layers, LucideIcon, Repeat, Target, Trophy } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

interface Props {
    overview: {
        total_workouts: number;
        total_volume_kg: number | string;
        total_sets: number;
        total_reps: number;
        current_streak_days: number;
        pr_count: number;
    };
    weekly: { labels: string[]; volumes: number[]; counts: number[] };
    monthly: { labels: string[]; volumes: number[]; counts: number[] };
    muscles: { labels: string[]; sets: number[] };
}

/** Counts up to `target` once on mount; jumps straight there when reduced motion is on. */
function useCountUp(target: number, ms = 900): number {
    const [value, setValue] = useState(() => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? target : 0));

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setValue(target);
            return;
        }
        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / ms);
            setValue(target * (1 - Math.pow(1 - t, 3)));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, ms]);

    return value;
}

export default function Statistics({ overview, weekly, monthly, muscles }: Props) {
    const streak = overview.current_streak_days;
    const volume = useCountUp(Number(overview.total_volume_kg) || 0);

    const totals: { label: string; value: string; Icon: LucideIcon; accent?: boolean }[] = [
        { label: 'Workouts', value: formatNumber(overview.total_workouts), Icon: Dumbbell },
        { label: 'Sets', value: formatNumber(overview.total_sets), Icon: Layers },
        { label: 'Reps', value: formatNumber(overview.total_reps), Icon: Repeat },
        // Lime only while the streak is alive, so the colour means something.
        { label: 'Current streak', value: `${streak} ${streak === 1 ? 'day' : 'days'}`, Icon: Flame, accent: streak > 0 },
    ];

    const bestWeekIndex = weekly.volumes.length ? weekly.volumes.indexOf(Math.max(...weekly.volumes)) : -1;
    const insights: { Icon: LucideIcon; text: ReactNode }[] = [];
    if (overview.pr_count > 0) {
        insights.push({
            Icon: Trophy,
            text: (
                <Link href={route('records.index')} className="hover:underline">
                    <strong className="tabular-nums">{overview.pr_count}</strong> personal {overview.pr_count === 1 ? 'record' : 'records'}
                </Link>
            ),
        });
    }
    if (bestWeekIndex >= 0 && weekly.volumes[bestWeekIndex] > 0) {
        insights.push({
            Icon: CalendarDays,
            text: (
                <>
                    Best week: <strong>{formatPeriod(weekly.labels[bestWeekIndex], 'week')}</strong> · {formatNumber(weekly.volumes[bestWeekIndex])} kg
                </>
            ),
        });
    }
    if (muscles.labels.length > 0) {
        insights.push({
            Icon: Target,
            text: (
                <>
                    Most trained this month: <strong>{muscles.labels[0]}</strong> · {muscles.sets[0]} sets
                </>
            ),
        });
    }

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Statistics</h1>}>
            <Head title="Statistics" />

            {/* Total volume is the headline number; the other totals support it. */}
            <Card>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total volume lifted</p>
                <p className="mt-1 text-4xl font-extrabold tabular-nums sm:text-5xl" aria-label={`${formatNumber(overview.total_volume_kg)} kg`}>
                    {formatNumber(Math.round(volume))} <span className="text-2xl font-bold text-zinc-500 dark:text-zinc-400">kg</span>
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-4 dark:border-zinc-800">
                    {totals.map(({ label, value, Icon, accent }) => (
                        <div key={label} className="flex items-start gap-3">
                            <Icon
                                className={`mt-0.5 h-5 w-5 shrink-0 ${accent ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-400 dark:text-zinc-500'}`}
                                aria-hidden
                            />
                            <div>
                                <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
                                <dd className="mt-0.5 text-xl font-extrabold tabular-nums">{value}</dd>
                            </div>
                        </div>
                    ))}
                </dl>

                {insights.length > 0 && (
                    <ul className="mt-5 flex flex-col gap-2 border-t border-zinc-200 pt-4 text-sm text-zinc-600 sm:flex-row sm:flex-wrap sm:gap-x-6 dark:border-zinc-800 dark:text-zinc-300">
                        {insights.map(({ Icon, text }, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <Icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card>
                    <h2 className="font-bold">Volume lifted per week (kg)</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Last 12 weeks, by week starting</p>
                    <VolumeChart labels={weekly.labels} volumes={weekly.volumes} period="week" className="mt-3 h-56" />
                </Card>
                <Card>
                    <h2 className="font-bold">Volume lifted per month (kg)</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Last 12 months</p>
                    <VolumeChart labels={monthly.labels} volumes={monthly.volumes} period="month" className="mt-3 h-56" />
                </Card>
                <Card className="lg:col-span-2">
                    <h2 className="font-bold">Sets per muscle, last 30 days</h2>
                    {muscles.labels.length === 0 ? (
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Complete a workout to see your muscle split.</p>
                    ) : (
                        <MuscleBars labels={muscles.labels} sets={muscles.sets} />
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
