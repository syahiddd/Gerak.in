import { EmptyState, Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Equipment, EXERCISE_TYPE_LABELS, Exercise, Muscle, Paginated } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    exercises: Paginated<Exercise>;
    muscles: Muscle[];
    equipment: Equipment[];
    filters: { q?: string; muscle?: string; equipment?: string; type?: string; sort?: string };
}

const TYPE_OPTIONS = Object.entries(EXERCISE_TYPE_LABELS);

export default function ExerciseIndex({ exercises, muscles, equipment, filters }: Props) {
    const { data, setData, get, processing } = useForm({
        q: filters.q ?? '',
        muscle: filters.muscle ?? '',
        equipment: filters.equipment ?? '',
        type: filters.type ?? '',
        sort: filters.sort ?? 'name',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('exercises.index'), { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Exercise Library</h1>}>
            <Head title="Exercises" />

            <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-6 dark:border-zinc-800 dark:bg-zinc-900">
                <input
                    type="search"
                    value={data.q}
                    onChange={(e) => setData('q', e.target.value)}
                    placeholder="Search exercises…"
                    className="rounded-xl border-zinc-300 text-sm sm:col-span-2 dark:border-zinc-700 dark:bg-zinc-800"
                    aria-label="Search exercises"
                />
                <select value={data.muscle} onChange={(e) => setData('muscle', e.target.value)} className="rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Muscle">
                    <option value="">All muscles</option>
                    {muscles.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
                <select value={data.equipment} onChange={(e) => setData('equipment', e.target.value)} className="rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Equipment">
                    <option value="">All equipment</option>
                    {equipment.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                </select>
                <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Exercise type">
                    <option value="">All types</option>
                    {TYPE_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <select value={data.sort} onChange={(e) => setData('sort', e.target.value)} className="rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Sort">
                    <option value="name">Sort: A–Z</option>
                    <option value="recent">Sort: Recent</option>
                </select>
                <div className="flex gap-2 sm:col-span-6">
                    <button disabled={processing} className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950 disabled:opacity-60">
                        {processing ? 'Filtering…' : 'Filter'}
                    </button>
                    <Link href={route('exercises.create')} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold dark:border-zinc-700">
                        + Custom
                    </Link>
                </div>
            </form>

            {exercises.data.length === 0 ? (
                <div className="mt-4">
                    <EmptyState title="No exercises found" hint="Try a different search or create a custom exercise." />
                </div>
            ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {exercises.data.map((ex) => (
                        <Link
                            key={ex.id}
                            href={route('exercises.show', ex.slug)}
                            className="rounded-2xl border border-zinc-200 bg-white p-4 hover:border-lime-400 dark:border-zinc-800 dark:bg-zinc-900"
                        >
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
            <Pagination links={exercises.links} />
        </AuthenticatedLayout>
    );
}
