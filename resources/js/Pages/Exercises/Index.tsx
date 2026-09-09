import { EmptyState, Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Equipment, EXERCISE_TYPE_LABELS, Exercise, Muscle, Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    exercises: Paginated<Exercise>;
    muscles: Muscle[];
    equipment: Equipment[];
    types: { value: string; label?: string }[] | string[];
    filters: { q?: string; muscle?: string; equipment?: string; type?: string };
}

export default function ExerciseIndex({ exercises, muscles, equipment, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [muscle, setMuscle] = useState(filters.muscle ?? '');
    const [equip, setEquip] = useState(filters.equipment ?? '');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('exercises.index'), { q, muscle, equipment: equip }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Exercise Library</h1>}>
            <Head title="Exercises" />

            <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-5 dark:border-zinc-800 dark:bg-zinc-900">
                <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search exercises…"
                    className="rounded-xl border-zinc-300 text-sm sm:col-span-2 dark:border-zinc-700 dark:bg-zinc-800"
                    aria-label="Search exercises"
                />
                <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Muscle">
                    <option value="">All muscles</option>
                    {muscles.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
                <select value={equip} onChange={(e) => setEquip(e.target.value)} className="rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="Equipment">
                    <option value="">All equipment</option>
                    {equipment.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                </select>
                <div className="flex gap-2">
                    <button className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950">Filter</button>
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
