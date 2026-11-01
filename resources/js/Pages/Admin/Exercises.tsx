import TextInput from '@/Components/TextInput';
import { btn, EmptyState, Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Exercise, Paginated } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

export default function AdminExercises({ exercises }: { exercises: Paginated<Exercise> }) {
    // Keep the current query in the box after searching.
    const [q, setQ] = useState(() => new URL(window.location.href).searchParams.get('q') ?? '');
    const search = useForm({});

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-extrabold">Admin: Exercises</h1>
                    <Link href={route('exercises.create')} className={btn.primary}>
                        <Plus className="h-4 w-4" aria-hidden />
                        New exercise
                    </Link>
                </div>
            }
        >
            <Head title="Admin exercises" />

            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    search.get(route('admin.exercises', { q: q || undefined }));
                }}
                className="flex max-w-md gap-2"
            >
                <label htmlFor="exercise-search" className="sr-only">
                    Search exercises
                </label>
                <TextInput id="exercise-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Exercise name" className="block w-full" />
                <button className={btn.secondary}>Search</button>
            </form>

            {exercises.data.length === 0 ? (
                <div className="mt-4">
                    <EmptyState
                        title={q ? `No exercises match “${q}”` : 'No exercises yet'}
                        action={
                            q ? (
                                <Link href={route('admin.exercises')} className={btn.secondary}>
                                    Clear search
                                </Link>
                            ) : undefined
                        }
                    />
                </div>
            ) : (
                <ul className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                    {exercises.data.map((ex) => (
                        <li key={ex.id}>
                            <Link
                                href={route('exercises.edit', ex.id)}
                                className="flex items-center gap-3 p-4 text-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900 dark:hover:bg-zinc-800/60 dark:focus-visible:ring-lime-400"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold">{ex.name}</p>
                                    <p className="break-all text-zinc-500 dark:text-zinc-400">
                                        {ex.slug} · {ex.primary_muscle?.name ?? 'No muscle'} · {ex.is_system ? 'System' : 'Custom'}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-lime-700 dark:text-lime-400">Edit</span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination links={exercises.links} />
        </AuthenticatedLayout>
    );
}
