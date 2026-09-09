import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Routine, RoutineFolder } from '@/types';
import { Head, useForm } from '@inertiajs/react';

export default function RoutineEdit({
    routine,
    folders,
}: {
    routine: Routine;
    exercises: unknown[];
    folders: RoutineFolder[];
}) {
    const { data, setData, patch, processing } = useForm({
        name: routine.name,
        folder_id: routine.folder_id ? String(routine.folder_id) : '',
        description: routine.description ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('routines.update', routine.id));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-extrabold">Edit: {routine.name}</h1>}>
            <Head title={`Edit ${routine.name}`} />

            <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                    <InputLabel htmlFor="name" value="Routine name" />
                    <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" required />
                </div>
                <div>
                    <InputLabel htmlFor="folder_id" value="Folder" />
                    <select id="folder_id" value={data.folder_id} onChange={(e) => setData('folder_id', e.target.value)} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                        <option value="">Ungrouped</option>
                        {folders.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <InputLabel htmlFor="description" value="Description" />
                    <textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} className="mt-1 block w-full rounded-xl border-zinc-300 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                </div>
                <PrimaryButton disabled={processing}>Save</PrimaryButton>
            </form>
        </AuthenticatedLayout>
    );
}
