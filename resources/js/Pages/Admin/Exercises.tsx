import TextInput from '@/Components/TextInput';
import { Pagination } from '@/Components/ui';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Exercise, Paginated } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function AdminExercises({ exercises }: { exercises: Paginated<Exercise> }) {
    const [q, setQ] = useState('');
    const search = useForm({});

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Admin — Exercises</h1>}>
            <Head title="Admin exercises" />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    search.get(route('admin.exercises', { q: q || undefined }));
                }}
                className="flex max-w-md gap-2"
            >
                <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises…" className="block w-full" />
                <button className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-zinc-950">
                    Search
                </button>
            </form>

            <div className="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {exercises.data.map((ex) => (
                    <div key={ex.id} className="p-4 text-sm">
                        <p className="font-bold">{ex.name}</p>
                        <p className="text-zinc-500">
                            {ex.slug} · {ex.primary_muscle?.name ?? '—'} · {ex.is_system ? 'system' : 'custom'}
                        </p>
                    </div>
                ))}
            </div>
            <Pagination links={exercises.links} />
        </AuthenticatedLayout>
    );
}
