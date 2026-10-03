import { EmptyState, Pagination } from '@/Components/ui';
import ExerciseMedia from '@/Components/ExerciseMedia';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { EXERCISE_TYPE_LABELS, Exercise, Paginated } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    exercises: Paginated<Exercise>;
    filters: { q?: string };
}

export default function ExerciseIndex({ exercises, filters = {} }: Props) {
    const rows = exercises?.data ?? [];
    const links = exercises?.links ?? [];
    const { data, setData, get, processing } = useForm({ q: filters.q ?? '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('exercises.index'), { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Exercise Library</h1>}>
            <Head title="Exercises" />

            <form onSubmit={submit} role="search" className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <input
                    type="search"
                    value={data.q}
                    onChange={(e) => setData('q', e.target.value)}
                    placeholder="Search exercises…"
                    className="min-w-0 flex-1 basis-48 rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    aria-label="Search exercises"
                />
                <button disabled={processing} className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950 disabled:opacity-60">
                    {processing ? 'Searching…' : 'Search'}
                </button>
            </form>

            {rows.length === 0 ? (
                <div className="mt-4">
                    <EmptyState title="No exercises found" hint="Try a different search term." />
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
                            <p className="mt-1 text-xs text-zinc-500">
                                {EXERCISE_TYPE_LABELS[ex.exercise_type] ?? ex.exercise_type} · {ex.primary_muscle?.name ?? '—'} · {ex.equipment?.name ?? '—'}
                            </p>
                            {!ex.is_system && (
                                <p className="mt-1 text-xs font-semibold text-lime-600 dark:text-lime-400">Custom</p>
                            )}
                        </Link>
                    ))}
                </div>
            )}
            <Pagination links={links} />
        </AuthenticatedLayout>
    );
}
