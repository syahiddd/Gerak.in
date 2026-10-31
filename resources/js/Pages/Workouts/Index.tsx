import { btn, EmptyState, Pagination } from '@/Components/ui';
import WorkoutRow from '@/Components/WorkoutRow';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Paginated, Workout } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Play, Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Props {
    workouts: Paginated<Workout>;
    active: { id: number; name: string; started_at: string; status: string } | null;
    filters: { from: string | null; to: string | null };
}

const monthLabel = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export default function WorkoutIndex({ workouts, active, filters }: Props) {
    const startEmpty = useForm({});
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const filtered = Boolean(filters.from || filters.to);

    const applyFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('workouts.index'), { from: from || undefined, to: to || undefined }, { preserveState: true });
    };

    // Rows arrive newest first, so a month heading goes in front of each month's first row.
    const months: { label: string; rows: Workout[] }[] = [];
    for (const w of workouts.data) {
        const label = monthLabel(w.started_at);
        if (months.at(-1)?.label !== label) months.push({ label, rows: [] });
        months.at(-1)!.rows.push(w);
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold">Workout history</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {workouts.total} {workouts.total === 1 ? 'workout' : 'workouts'}
                            {filtered ? ' in this range' : ' logged'}
                        </p>
                    </div>
                    {!active && (
                        <button onClick={() => startEmpty.post(route('workouts.start-empty'))} disabled={startEmpty.processing} className={btn.primary}>
                            <Plus className="h-4 w-4" aria-hidden />
                            Start empty workout
                        </button>
                    )}
                </div>
            }
        >
            <Head title="History" />

            {active && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lime-400 bg-white p-4 dark:bg-zinc-900">
                    <div>
                        <p className="font-extrabold">
                            {active.status === 'paused' ? 'Paused' : 'In progress'}: {active.name}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Started {new Date(active.started_at).toLocaleString()}</p>
                    </div>
                    <Link href={route('workouts.show', active.id)} className={btn.primary}>
                        <Play className="h-4 w-4" aria-hidden />
                        Resume
                    </Link>
                </div>
            )}

            <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-3">
                <label className="text-sm">
                    <span className="mb-1 block font-semibold text-zinc-600 dark:text-zinc-300">From</span>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block font-semibold text-zinc-600 dark:text-zinc-300">To</span>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                </label>
                <button className={btn.secondary}>Filter</button>
                {filtered && (
                    <Link href={route('workouts.index')} className={btn.ghost}>
                        Clear
                    </Link>
                )}
            </form>

            <div className="mt-6 space-y-8">
                {workouts.data.length === 0 &&
                    (filtered ? (
                        <EmptyState title="No workouts in this range" hint="Try a wider date range, or clear the filter to see everything." />
                    ) : (
                        <EmptyState title="No workouts yet" hint="Finished workouts land here, newest first. Start one from a routine or from scratch." />
                    ))}

                {months.map((month) => (
                    <section key={month.label} aria-label={month.label}>
                        <h2 className="mb-2 text-sm font-bold text-zinc-500 dark:text-zinc-400">{month.label}</h2>
                        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                            {month.rows.map((w) => (
                                <li key={w.id}>
                                    <WorkoutRow workout={w} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
            <Pagination links={workouts.links} />
        </AuthenticatedLayout>
    );
}
