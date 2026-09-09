import { EmptyState, Pagination } from '@/Components/ui';
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
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-extrabold">Workout History</h1>
                    <div className="flex gap-2">
                        <Link href={route('workouts.active')} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold dark:border-zinc-700">
                            Resume active
                        </Link>
                        <button
                            onClick={() => startEmpty.post(route('workouts.start-empty'))}
                            className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950"
                        >
                            + Empty workout
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="History" />

            <form
                method="GET"
                action={route('workouts.index')}
                className="flex gap-2 text-sm"
                onSubmit={(e) => {
                    e.preventDefault();
                    window.location.href = route('workouts.index', { from: from || undefined, to: to || undefined });
                }}
            >
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="From" />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="To" />
                <button className="rounded-xl border border-zinc-300 px-4 py-2 font-bold dark:border-zinc-700">Filter</button>
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
                                <p className="text-xs text-zinc-500">
                                    {new Date(w.started_at).toLocaleString()} · {w.exercises_count} exercises
                                </p>
                            </div>
                            <div className="text-right text-sm tabular-nums">
                                <p className="font-bold">{formatNumber(w.total_volume_kg)} kg</p>
                                <p className="text-xs text-zinc-500">{formatDuration(w.duration_seconds)}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            <Pagination links={workouts.links} />
        </AuthenticatedLayout>
    );
}
