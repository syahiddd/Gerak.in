import { Card, EmptyState, StatCard } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDuration, formatNumber } from '@/lib/units';
import { PageProps, PersonalRecord, Routine, Workout } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
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

interface Props extends PageProps {
    overview: {
        total_workouts: number;
        total_volume_kg: number | string;
        total_sets: number;
        current_streak_days: number;
        pr_count: number;
    };  
    weekly: { labels: string[]; volumes: number[]; counts: number[] };
    muscles: { labels: string[]; sets: number[] };
    recentWorkouts: Workout[];
    activeWorkout: Workout | null;
    routines: Routine[];
    recentPrs: (PersonalRecord & { exercise: { name: string } })[];
    greeting: string;
}

const PIE_COLORS = ['#a3e635', '#34d399', '#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#94a3b8'];

export default function Dashboard({
    auth,
    overview,
    weekly,
    muscles,
    recentWorkouts,
    activeWorkout,
    routines,
    recentPrs,
    greeting,
}: Props) {
    const startEmpty = useForm({});
    const weeklyData = weekly.labels.map((label, i) => ({
        week: label,
        volume: weekly.volumes[i] ?? 0,
    }));
    const muscleData = muscles.labels.map((label, i) => ({
        name: label,
        sets: muscles.sets[i] ?? 0,
    }));

    return (
        <AuthenticatedLayout
            header={
                <>
                    <h1 className="text-xl font-extrabold">
                        {greeting}, {auth.user.name}
                    </h1>
                    <p className="text-sm text-zinc-500">What are we training today?</p>
                </>
            }
        >
            <Head title="Dashboard" />

            {activeWorkout && (
                <div className="mb-4 flex items-center justify-between rounded-2xl bg-lime-400 p-4 text-zinc-950">
                    <div>
                        <p className="font-extrabold">Resume workout: {activeWorkout.name}</p>
                        <p className="text-sm">Started {new Date(activeWorkout.started_at).toLocaleString()}</p>
                    </div>
                    <Link
                        href={route('workouts.show', activeWorkout.id)}
                        className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white"
                    >
                        Resume
                    </Link>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        <h2 className="font-bold">Today's workout</h2>
                        {routines.length > 0 ? (
                            <>
                                <p className="mt-2 text-lg font-extrabold">{routines[0].name}</p>
                                <p className="text-sm text-zinc-500">{routines[0].exercises_count} exercises</p>
                                <div className="mt-3 flex gap-2">
                                    <Link
                                        href={route('workouts.start-routine', routines[0].id)}
                                        method="post"
                                        as="button"
                                        className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950"
                                    >
                                        Start Workout
                                    </Link>
                                    <Link
                                        href={route('routines.show', routines[0].id)}
                                        className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold dark:border-zinc-700"
                                    >
                                        View
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="mt-3">
                                <EmptyState
                                    title="No routines yet"
                                    hint="Create your first routine to get going."
                                    action={
                                        <Link href={route('routines.create')} className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950">
                                            Create routine
                                        </Link>
                                    }
                                />
                            </div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2 text-sm">
                            <button
                                onClick={() => startEmpty.post(route('workouts.start-empty'))}
                                className="rounded-xl border border-zinc-300 px-3 py-2 font-semibold dark:border-zinc-700"
                            >
                                Start empty workout
                            </button>
                            <Link href={route('exercises.index')} className="rounded-xl border border-zinc-300 px-3 py-2 font-semibold dark:border-zinc-700">
                                Browse exercises
                            </Link>
                            <Link href={route('measurements.index')} className="rounded-xl border border-zinc-300 px-3 py-2 font-semibold dark:border-zinc-700">
                                Add measurement
                            </Link>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold">Recent workouts</h2>
                            <Link href={route('workouts.index')} className="text-sm font-semibold text-lime-600 dark:text-lime-400">
                                History
                            </Link>
                        </div>
                        {recentWorkouts.length === 0 && (
                            <div className="mt-3">
                                <EmptyState title="No workouts yet" hint="Your completed workouts will appear here." />
                            </div>
                        )}
                        {recentWorkouts.map((w) => (
                            <Link
                                key={w.id}
                                href={route('workouts.show', w.id)}
                                className="mt-3 flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                            >
                                <div>
                                    <p className="font-bold">{w.name}</p>
                                    <p className="text-xs text-zinc-500">
                                        {new Date(w.started_at).toLocaleString()} · {w.exercises_count} exercises
                                    </p>
                                </div>
                                <div className="text-right text-sm tabular-nums">
                                    <p className="font-bold">{formatNumber(w.total_volume_kg)} kg</p>
                                    <p className="text-xs text-zinc-500">{formatDuration(w.duration_seconds)}</p>
                                </div>
                            </Link>
                        ))}
                    </Card>

                    <Card>
                        <h2 className="font-bold">Weekly activity</h2>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="volume" fill="#a3e635" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Workouts" value={overview.total_workouts} />
                        <StatCard label="Volume" value={`${formatNumber(overview.total_volume_kg)} kg`} />
                        <StatCard label="Sets" value={overview.total_sets} />
                        <StatCard label="Streak" value={`${overview.current_streak_days}d`} />
                    </div>

                    <Card>
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
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold">Recent PRs</h2>
                            <Link href={route('records.index')} className="text-sm font-semibold text-lime-600 dark:text-lime-400">
                                All
                            </Link>
                        </div>
                        {recentPrs.length === 0 && (
                            <p className="mt-2 text-sm text-zinc-500">No PRs yet. Finish a workout to set one.</p>
                        )}
                        {recentPrs.map((pr) => (
                            <div key={pr.id} className="mt-2 text-sm">
                                <p className="font-bold">{pr.exercise.name}</p>
                                <p className="text-zinc-500">
                                    {pr.record_type}: {formatNumber(pr.value_primary)}
                                    {pr.value_reps ? ` × ${pr.value_reps}` : ''}
                                </p>
                            </div>
                        ))}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
