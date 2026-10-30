import { Card, MuscleBars } from '@/Components/ui';
import VolumeChart from '@/Components/VolumeChart';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatNumber } from '@/lib/units';
import { Head } from '@inertiajs/react';

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

export default function Statistics({ overview, weekly, monthly, muscles }: Props) {
    const streak = overview.current_streak_days;
    const totals: [string, string][] = [
        ['Workouts', formatNumber(overview.total_workouts)],
        ['Sets', formatNumber(overview.total_sets)],
        ['Reps', formatNumber(overview.total_reps)],
        ['Current streak', `${streak} ${streak === 1 ? 'day' : 'days'}`],
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Statistics</h1>}>
            <Head title="Statistics" />

            {/* Total volume is the headline number; the other totals support it. */}
            <Card>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total volume lifted</p>
                <p className="mt-1 text-4xl font-extrabold tabular-nums">{formatNumber(overview.total_volume_kg)} kg</p>
                <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-4 dark:border-zinc-800">
                    {totals.map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
                            <dd className="mt-0.5 text-xl font-extrabold tabular-nums">{value}</dd>
                        </div>
                    ))}
                </dl>
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
