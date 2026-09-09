import { StatCard } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatNumber } from '@/lib/units';
import { Head } from '@inertiajs/react';
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

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

const PIE_COLORS = ['#a3e635', '#34d399', '#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#94a3b8'];

export default function Statistics({ overview, weekly, monthly, muscles }: Props) {
    const weeklyData = weekly.labels.map((label, i) => ({ period: label, volume: weekly.volumes[i] ?? 0 }));
    const monthlyData = monthly.labels.map((label, i) => ({ period: label, volume: monthly.volumes[i] ?? 0 }));
    const muscleData = muscles.labels.map((label, i) => ({ name: label, sets: muscles.sets[i] ?? 0 }));

    const volumeChart = (data: { period: string; volume: number }[]) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="volume" fill="#a3e635" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Statistics</h1>}>
            <Head title="Statistics" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard label="Workouts" value={overview.total_workouts} />
                <StatCard label="Volume" value={`${formatNumber(overview.total_volume_kg)} kg`} />
                <StatCard label="Sets" value={overview.total_sets} />
                <StatCard label="Reps" value={formatNumber(overview.total_reps)} />
                <StatCard label="Streak" value={`${overview.current_streak_days}d`} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="font-bold">Volume per week (12w)</h2>
                    <div className="h-56">{volumeChart(weeklyData)}</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="font-bold">Volume per month (12m)</h2>
                    <div className="h-56">{volumeChart(monthlyData)}</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
                    <h2 className="font-bold">Muscle distribution (30d)</h2>
                    {muscleData.length === 0 ? (
                        <p className="mt-2 text-sm text-zinc-500">Complete a workout to see your muscle split.</p>
                    ) : (
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={muscleData} dataKey="sets" nameKey="name" outerRadius={80} label>
                                        {muscleData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
