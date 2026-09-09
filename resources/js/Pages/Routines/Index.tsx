import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Routine, RoutineFolder } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

export default function RoutineIndex({
    folders,
    ungrouped,
}: {
    folders: RoutineFolder[];
    ungrouped: Routine[];
}) {
    const folderForm = useForm({ name: '' });

    const createFolder = (e: React.FormEvent) => {
        e.preventDefault();
        folderForm.post(route('folders.store'), { onSuccess: () => folderForm.reset() });
    };

    const cards = (routines: Routine[]) => (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {routines.length === 0 && <p className="text-sm text-zinc-500">Empty.</p>}
            {routines.map((r) => (
                <Link
                    key={r.id}
                    href={route('routines.show', r.id)}
                    className="rounded-xl border border-zinc-200 p-3 hover:border-lime-400 dark:border-zinc-800"
                >
                    <p className="font-bold">{r.name}</p>
                    <p className="text-xs text-zinc-500">{r.exercises_count} exercises</p>
                </Link>
            ))}
        </div>
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-extrabold">Routines</h1>
                    <Link href={route('routines.create')} className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950">
                        + New routine
                    </Link>
                </div>
            }
        >
            <Head title="Routines" />

            <form onSubmit={createFolder} className="flex max-w-md gap-2">
                <TextInput
                    value={folderForm.data.name}
                    onChange={(e) => folderForm.setData('name', e.target.value)}
                    placeholder="New folder (e.g. PPL)"
                    className="block w-full"
                    required
                />
                <button className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-zinc-950">
                    Create
                </button>
            </form>

            {folders.map((folder) => (
                <div key={folder.id} className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold">{folder.name}</h2>
                        <Link
                            href={route('folders.destroy', folder.id)}
                            method="delete"
                            as="button"
                            className="text-xs font-semibold text-red-500"
                            onBefore={() => confirm('Delete folder? Routines become ungrouped.')}
                        >
                            Delete
                        </Link>
                    </div>
                    {cards(folder.routines)}
                </div>
            ))}

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="font-bold">Ungrouped</h2>
                {cards(ungrouped)}
            </div>
        </AuthenticatedLayout>
    );
}
