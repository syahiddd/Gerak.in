import { btn, EmptyState, Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDuration, formatNumber } from '@/lib/units';
import { Paginated, Workout } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function WorkoutIndex({ workouts }: { workouts: Paginated<Workout> }) {
    const startEmpty = useForm({});
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-extrabold">Workout History</h1>
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('workouts.active')} className={btn.secondary}>
                            Resume active
                        </Link>
                        <button
                            onClick={() => startEmpty.post(route('workouts.start-empty'))}
                            className={btn.primary}
                        >
                            Start empty workout
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="History" />

            <form
                method="GET"
                action={route('workouts.index')}
                className="flex flex-wrap items-center gap-2 text-sm"
                onSubmit={(e) => {
                    e.preventDefault();
                    window.location.href = route('workouts.index', { from: from || undefined, to: to || undefined });
                }}
            >
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="From" />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="To" />
                <button className={btn.secondary}>Filter</button>
            </form>

            <div className="mt-4 space-y-3">
                {workouts.data.length === 0 && (
                    <EmptyState title="No workouts yet" hint="Your completed workouts will appear here." />
                )}
                {workouts.data.map((w) => (
                    <Link
                        key={w.id}
                        href={route('workouts.show', w.id)}
                        className="block rounded-2xl border border-zinc-200 bg-white p-4 hover:border-lime-400 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold">{w.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {new Date(w.started_at).toLocaleString()} · {w.exercises_count} exercises
                                </p>
                            </div>
                            <div className="text-right text-sm tabular-nums">
                                <p className="font-bold">{formatNumber(w.total_volume_kg)} kg</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDuration(w.duration_seconds)}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            <Pagination links={workouts.links} />
        </AuthenticatedLayout>
    );
}
