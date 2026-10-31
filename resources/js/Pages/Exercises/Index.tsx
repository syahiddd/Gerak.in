import { btn, EmptyState, Pagination } from '@/Components/ui';
import ExerciseMedia from '@/Components/ExerciseMedia';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { EXERCISE_TYPE_LABELS, Exercise, Muscle, Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    exercises: Paginated<Exercise>;
    muscles: Muscle[];
    filters: { q?: string; muscle?: number | string };
}

export default function ExerciseIndex({ exercises, muscles = [], filters = {} }: Props) {
    const rows = exercises?.data ?? [];
    const links = exercises?.links ?? [];
    const [q, setQ] = useState(filters.q ?? '');
    const [processing, setProcessing] = useState(false);
    const activeMuscle = String(filters.muscle ?? '');
    const chipRow = useRef<HTMLElement>(null);

    // On a phone the row scrolls sideways; keep the selected muscle in view.
    // Waits for the webfont because chip widths change once it loads.
    useEffect(() => {
        document.fonts.ready.then(() =>
            chipRow.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' }),
        );
    }, [activeMuscle]);

    // Search and muscle always travel together, so changing one never drops the other.
    const visit = (params: { q?: string; muscle?: number | string }) => {
        const query = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
        router.get(route('exercises.index'), query, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        visit({ q, muscle: filters.muscle });
    };

    const chip = (active: boolean) =>
        `inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 ${
            active
                ? 'bg-lime-400 text-zinc-950'
                : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
        }`;

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Exercise Library</h1>}>
            <Head title="Exercises" />

            <form onSubmit={submit} role="search" className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search exercises…"
                    className="min-w-0 flex-1 basis-48 rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    aria-label="Search exercises"
                />
                <button disabled={processing} className={btn.secondary}>
                    {processing ? 'Searching…' : 'Search'}
                </button>
            </form>

            {muscles.length > 0 && (
                <nav ref={chipRow} aria-label="Filter by muscle" className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                    <button type="button" aria-pressed={activeMuscle === ''} onClick={() => visit({ q: filters.q })} className={chip(activeMuscle === '')}>
                        All
                    </button>
                    {muscles.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            aria-pressed={activeMuscle === String(m.id)}
                            onClick={() => visit({ q: filters.q, muscle: m.id })}
                            className={chip(activeMuscle === String(m.id))}
                        >
                            {m.name}
                        </button>
                    ))}
                </nav>
            )}

            {rows.length === 0 ? (
                <div className="mt-4">
                    {activeMuscle ? (
                        <EmptyState
                            title="No exercises found"
                            hint={filters.q ? `Nothing matches “${filters.q}” for this muscle.` : 'No exercises for this muscle yet.'}
                            action={
                                <button type="button" onClick={() => visit({ q: filters.q })} className={btn.secondary}>
                                    Show all
                                </button>
                            }
                        />
                    ) : (
                        <EmptyState title="No exercises found" hint="Try a different search term." />
                    )}
                </div>
            ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map((ex) => (
                        <Link
                            key={ex.id}
                            href={route('exercises.show', ex.slug)}
                            className="rounded-2xl border border-zinc-200 bg-white p-4 hover:border-lime-400 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <ExerciseMedia exercise={ex} variant="thumbnail" className="mb-3" playOnHover />
                            <p className="font-bold">{ex.name}</p>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {EXERCISE_TYPE_LABELS[ex.exercise_type] ?? ex.exercise_type} · {ex.primary_muscle?.name ?? '-'} · {ex.equipment?.name ?? '-'}
                            </p>
                            {!ex.is_system && (
                                <p className="mt-1 text-xs font-semibold text-lime-700 dark:text-lime-400">Custom</p>
                            )}
                        </Link>
                    ))}
                </div>
            )}
            <Pagination links={links} />
        </AuthenticatedLayout>
    );
}
